import argon2 from 'argon2';
import type { LoginInput, RegisterInput } from '@borrowcircle/shared';
import { User } from '../models/user.js';
import { AppError, isDuplicateKey } from '../utils/errors.js';
import { userDto } from './dto.js';

export async function register(input: RegisterInput) {
  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
  try {
    return userDto(await User.create({ name: input.name, email: input.email, passwordHash }));
  } catch (error) {
    if (isDuplicateKey(error))
      throw new AppError(409, 'An account with this email already exists', {
        email: 'Email already registered',
      });
    throw error;
  }
}
export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !(await argon2.verify(user.passwordHash, input.password)))
    throw new AppError(401, 'Email or password is incorrect');
  return userDto(user);
}
export async function currentUser(id?: string) {
  if (!id) return null;
  const user = await User.findById(id);
  return user ? userDto(user) : null;
}
