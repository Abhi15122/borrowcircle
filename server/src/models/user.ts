import { Schema, model, type InferSchemaType } from 'mongoose';
const schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);
export type UserRecord = InferSchemaType<typeof schema>;
export const User = model('User', schema);
