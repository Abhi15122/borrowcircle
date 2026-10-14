import mongoose, { Types, type QueryFilter } from 'mongoose';
import type { ItemInput, ItemQuery, PageDto, ItemDto } from '@borrowcircle/shared';
import { Item, type ItemRecord } from '../models/item.js';
import { BorrowRequest } from '../models/borrow-request.js';
import { Reservation } from '../models/reservation.js';
import { AppError } from '../utils/errors.js';
import { itemDto } from './dto.js';

export async function listItems(query: ItemQuery, userId?: string): Promise<PageDto<ItemDto>> {
  const filter: QueryFilter<ItemRecord> = { archived: false };
  if (query.mine) {
    if (!userId) throw new AppError(401, 'Please sign in');
    filter.owner = new Types.ObjectId(userId);
  }
  if (query.category) filter.category = query.category;
  if (query.search)
    filter.title = { $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (query.startDate && query.endDate) {
    const reserved = await Reservation.distinct('item', {
      date: { $gte: query.startDate, $lte: query.endDate },
    });
    filter._id = { $nin: reserved };
    filter.activeLoan = null;
  }
  const [items, total] = await Promise.all([
    Item.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Item.countDocuments(filter),
  ]);
  return {
    data: await Promise.all(items.map(itemDto)),
    total,
    page: query.page,
    pages: Math.ceil(total / query.limit),
  };
}
export async function getItem(id: string) {
  const item = await Item.findById(id);
  if (!item || item.archived) throw new AppError(404, 'Item not found');
  const reservations = await Reservation.find({ item: item._id }).sort({ date: 1 });
  return { ...(await itemDto(item)), reservedDates: reservations.map((value) => value.date) };
}
export async function createItem(input: ItemInput, userId: string) {
  return itemDto(await Item.create({ ...input, owner: userId }));
}
export async function editItem(id: string, input: ItemInput, userId: string) {
  const item = await Item.findById(id);
  if (!item || item.archived) throw new AppError(404, 'Item not found');
  if (item.owner.toString() !== userId)
    throw new AppError(403, 'Only the owner can edit this item');
  const updated = await Item.findOneAndUpdate(
    { _id: id, owner: userId, archived: false },
    { $set: input, $inc: { revision: 1 } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!updated) throw new AppError(409, 'Item changed; refresh and try again');
  return itemDto(updated);
}
export async function archiveItem(id: string, userId: string) {
  await mongoose.connection.transaction(async (session) => {
    const item = await Item.findById(id).session(session);
    if (!item || item.archived) throw new AppError(404, 'Item not found');
    if (item.owner.toString() !== userId)
      throw new AppError(403, 'Only the owner can archive this item');
    const locked = await Item.findOneAndUpdate(
      { _id: id, archived: false, activeLoan: null },
      { $inc: { revision: 1 } },
      { session, returnDocument: 'after' },
    );
    if (!locked) throw new AppError(409, 'Return the active loan before archiving');
    if (
      await BorrowRequest.exists({ item: id, status: { $in: ['approved', 'borrowed'] } }).session(
        session,
      )
    ) {
      throw new AppError(409, 'Cancel approved requests or finish loans before archiving');
    }
    await BorrowRequest.updateMany(
      { item: id, status: 'pending' },
      { $set: { status: 'rejected' } },
      { session },
    );
    await Item.updateOne({ _id: id }, { $set: { archived: true } }, { session });
  });
}
