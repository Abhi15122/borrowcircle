import { Schema, model, type InferSchemaType } from 'mongoose';
import { categories, conditions } from '@borrowcircle/shared';
const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: categories, required: true },
    condition: { type: String, enum: conditions, required: true },
    pickupArea: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    archived: { type: Boolean, default: false },
    activeLoan: { type: Schema.Types.ObjectId, ref: 'BorrowRequest', default: null },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);
schema.index({ archived: 1, category: 1, createdAt: -1, _id: -1 });
schema.index({ owner: 1, archived: 1, createdAt: -1, _id: -1 });
export type ItemRecord = InferSchemaType<typeof schema>;
export const Item = model('Item', schema);
