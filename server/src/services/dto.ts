import type { HydratedDocument } from 'mongoose';
import type { ItemDto, UserDto, BorrowRequestDto } from '@borrowcircle/shared';
import type { UserRecord } from '../models/user.js';
import type { ItemRecord } from '../models/item.js';
import type { BorrowRecord } from '../models/borrow-request.js';
import { User } from '../models/user.js';
import { Item } from '../models/item.js';
import { AppError } from '../utils/errors.js';

export function userDto(user: HydratedDocument<UserRecord>): UserDto {
  return { id: user.id, name: user.name };
}
export async function itemDto(item: HydratedDocument<ItemRecord>): Promise<ItemDto> {
  const owner = await User.findById(item.owner);
  if (!owner) throw new AppError(404, 'Item owner not found');
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    condition: item.condition,
    pickupArea: item.pickupArea,
    imageUrl: item.imageUrl,
    owner: userDto(owner),
    archived: item.archived,
    onLoan: Boolean(item.activeLoan),
  };
}
export async function requestDto(
  request: HydratedDocument<BorrowRecord>,
): Promise<BorrowRequestDto> {
  const [item, borrower, owner] = await Promise.all([
    Item.findById(request.item),
    User.findById(request.borrower),
    User.findById(request.owner),
  ]);
  if (!item || !borrower || !owner) throw new AppError(404, 'Request details not found');
  return {
    id: request.id,
    item: await itemDto(item),
    borrower: userDto(borrower),
    owner: userDto(owner),
    startDate: request.startDate,
    endDate: request.endDate,
    note: request.note,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    handedOverAt: request.handedOverAt?.toISOString() ?? null,
    returnedAt: request.returnedAt?.toISOString() ?? null,
  };
}
