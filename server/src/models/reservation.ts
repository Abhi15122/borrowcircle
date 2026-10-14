import { Schema, model } from 'mongoose';
const schema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  date: { type: String, required: true },
  request: { type: Schema.Types.ObjectId, ref: 'BorrowRequest', required: true },
});
schema.index({ item: 1, date: 1 }, { unique: true });
schema.index({ request: 1 });
export const Reservation = model('Reservation', schema);
