import { Schema, model, type InferSchemaType } from 'mongoose';
import { requestStatuses } from '@borrowcircle/shared';
const schema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    note: { type: String, default: '' },
    status: { type: String, enum: requestStatuses, default: 'pending', required: true },
    handedOverAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ borrower: 1, createdAt: -1, _id: -1 });
schema.index({ owner: 1, createdAt: -1, _id: -1 });
schema.index({ item: 1, status: 1 });
export type BorrowRecord = InferSchemaType<typeof schema>;
export const BorrowRequest = model('BorrowRequest', schema);
