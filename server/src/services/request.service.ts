import mongoose, { type ClientSession, type HydratedDocument } from 'mongoose';
import {
  calendarDays,
  communityToday,
  type BorrowInput,
  type RequestAction,
  type RequestQuery,
  type RequestStatus,
} from '@borrowcircle/shared';
import { Item } from '../models/item.js';
import { BorrowRequest, type BorrowRecord } from '../models/borrow-request.js';
import { Reservation } from '../models/reservation.js';
import { AppError, isDuplicateKey } from '../utils/errors.js';
import { requestDto } from './dto.js';

export async function createRequest(itemId: string, input: BorrowInput, userId: string) {
  const id = await mongoose.connection.transaction(async (session) => {
    // Every item lifecycle mutation writes this document: concurrent archive/approval must retry.
    const item = await Item.findOneAndUpdate(
      { _id: itemId, archived: false },
      { $inc: { revision: 1 } },
      { session, returnDocument: 'after' },
    );
    if (!item) throw new AppError(404, 'Item is no longer available');
    if (item.owner.toString() === userId)
      throw new AppError(403, 'You cannot borrow your own item');
    const [request] = await BorrowRequest.create(
      [{ ...input, item: itemId, owner: item.owner, borrower: userId }],
      { session },
    );
    if (!request) throw new AppError(500, 'Could not create request');
    return request.id;
  });
  return getRequest(id);
}
async function getRequest(id: string) {
  const request = await BorrowRequest.findById(id);
  if (!request) throw new AppError(404, 'Request not found');
  return requestDto(request);
}
export async function listRequests(query: RequestQuery, userId: string) {
  const filter = query.view === 'borrowing' ? { borrower: userId } : { owner: userId };
  const [requests, total] = await Promise.all([
    BorrowRequest.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    BorrowRequest.countDocuments(filter),
  ]);
  return {
    data: await Promise.all(requests.map(requestDto)),
    total,
    page: query.page,
    pages: Math.ceil(total / query.limit),
  };
}
async function transition(
  request: HydratedDocument<BorrowRecord>,
  status: RequestStatus,
  session: ClientSession,
  timestamps: { handedOverAt?: Date; returnedAt?: Date } = {},
) {
  const result = await BorrowRequest.updateOne(
    { _id: request._id, status: request.status },
    { $set: { status, ...timestamps } },
    { session },
  );
  if (!result.modifiedCount) throw new AppError(409, 'Request changed; refresh and try again');
}
async function applyAction(
  request: HydratedDocument<BorrowRecord>,
  action: RequestAction,
  session: ClientSession,
) {
  const today = communityToday();
  if (action === 'approve') {
    if (request.status !== 'pending' || request.startDate < today)
      throw new AppError(409, 'Only pending requests with current or future dates can be approved');
    await Reservation.insertMany(
      calendarDays(request.startDate, request.endDate).map((date) => ({
        item: request.item,
        request: request._id,
        date,
      })),
      { session, ordered: true },
    );
    await transition(request, 'approved', session);
  } else if (action === 'reject') {
    if (request.status !== 'pending')
      throw new AppError(409, 'Only pending requests can be rejected');
    await transition(request, 'rejected', session);
  } else if (action === 'cancel') {
    if (request.status !== 'pending' && request.status !== 'approved')
      throw new AppError(409, 'This request cannot be cancelled');
    await transition(request, 'cancelled', session);
    await Reservation.deleteMany({ request: request._id }, { session });
  } else if (action === 'handover') {
    if (request.status !== 'approved' || today < request.startDate || today > request.endDate)
      throw new AppError(409, 'Handover requires an approved request within its booked dates');
    const item = await Item.updateOne(
      { _id: request.item, archived: false, activeLoan: null },
      { $set: { activeLoan: request._id } },
      { session },
    );
    if (!item.modifiedCount)
      throw new AppError(409, 'This item already has an active loan; confirm its return first');
    await transition(request, 'borrowed', session, { handedOverAt: new Date() });
  } else {
    if (request.status !== 'borrowed')
      throw new AppError(409, 'Only borrowed items can be returned');
    const item = await Item.updateOne(
      { _id: request.item, activeLoan: request._id },
      { $set: { activeLoan: null } },
      { session },
    );
    if (!item.modifiedCount) throw new AppError(409, 'Active loan changed; refresh and try again');
    await transition(request, 'returned', session, { returnedAt: new Date() });
    await Reservation.deleteMany({ request: request._id }, { session });
  }
}
export async function actOnRequest(id: string, action: RequestAction, userId: string) {
  try {
    await mongoose.connection.transaction(async (session) => {
      const request = await BorrowRequest.findById(id).session(session);
      if (!request) throw new AppError(404, 'Request not found');
      const authorizedUser = action === 'cancel' ? request.borrower : request.owner;
      if (authorizedUser.toString() !== userId)
        throw new AppError(403, 'You do not have permission for this action');
      const item = await Item.findOneAndUpdate(
        { _id: request.item, archived: false },
        { $inc: { revision: 1 } },
        { session, returnDocument: 'after' },
      );
      if (!item) throw new AppError(409, 'Item is archived');
      await applyAction(request, action, session);
    });
  } catch (error) {
    if (isDuplicateKey(error)) throw new AppError(409, 'These dates have already been reserved');
    throw error;
  }
  return getRequest(id);
}
