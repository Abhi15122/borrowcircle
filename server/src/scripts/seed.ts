import 'dotenv/config';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { readEnvironment } from '../config/env.js';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/user.js';
import { Item } from '../models/item.js';
import { itemSchema } from '@borrowcircle/shared';

const environment = readEnvironment();
if (environment.NODE_ENV !== 'development')
  throw new Error('Seeding is only available in development');
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 10)
  throw new Error('Set a fictional DEMO_PASSWORD of at least 10 characters');
await connectDatabase(environment.MONGODB_URI);
try {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const people = [
    { name: 'Maya Singh', email: 'maya@example.test' },
    { name: 'Arjun Rao', email: 'arjun@example.test' },
  ];
  const items = [
    {
      title: 'Weekend camping tent',
      description:
        'A comfortable two-person tent with pegs and a rain cover. Please dry it before returning.',
      category: 'Outdoors',
      condition: 'Good',
      pickupArea: 'Saket community centre',
    },
    {
      title: 'Cordless drill kit',
      description: 'A compact cordless drill with a selection of bits for small home projects.',
      category: 'Tools',
      condition: 'Good',
      pickupArea: 'Hauz Khas market',
    },
    {
      title: 'Instant camera',
      description: 'Capture a few memories at your next gathering. Bring your own compatible film.',
      category: 'Electronics',
      condition: 'Like new',
      pickupArea: 'Saket community centre',
    },
    {
      title: 'Badminton set',
      description: 'Two rackets and a tube of shuttlecocks, ready for an evening in the park.',
      category: 'Sports',
      condition: 'Good',
      pickupArea: 'Hauz Khas market',
    },
    {
      title: 'The design bookshelf',
      description: 'A small collection of books about everyday design and creative thinking.',
      category: 'Books',
      condition: 'Well loved',
      pickupArea: 'Saket community centre',
    },
    {
      title: 'Sunday baking kit',
      description: 'Mixing bowls, measuring cups and a loaf tin for your next baking experiment.',
      category: 'Home',
      condition: 'Good',
      pickupArea: 'Hauz Khas market',
    },
  ];
  const users = [];
  for (const person of people)
    users.push(
      await User.findOneAndUpdate(
        { email: person.email },
        { $setOnInsert: { ...person, passwordHash } },
        { upsert: true, returnDocument: 'after' },
      ),
    );
  for (const [index, value] of items.entries()) {
    const owner = users[index % users.length];
    if (!owner) throw new Error('Seed owner missing');
    const input = itemSchema.parse({ ...value, imageUrl: '' });
    await Item.updateOne(
      { owner: owner._id, title: input.title },
      { $setOnInsert: { ...input, owner: owner._id } },
      { upsert: true },
    );
  }
  console.info(
    'Seed ready: maya@example.test and arjun@example.test. Use your configured DEMO_PASSWORD. Existing data was preserved.',
  );
} finally {
  await mongoose.disconnect();
}
