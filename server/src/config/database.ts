import mongoose from 'mongoose';
import { User } from '../models/user.js';
import { Item } from '../models/item.js';
import { BorrowRequest } from '../models/borrow-request.js';
import { Reservation } from '../models/reservation.js';
export async function connectDatabase(uri: string, timeoutMs = 5000) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: timeoutMs,
    autoIndex: false,
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 60_000,
  });
  const hello = await mongoose.connection.db?.admin().command({ hello: 1 });
  if (!hello?.setName && hello?.msg !== 'isdbgrid')
    throw new Error(
      'MongoDB must run as a replica set or sharded cluster for borrowing transactions',
    );
  for (const model of [User, Item, BorrowRequest, Reservation]) await model.createIndexes();
}
