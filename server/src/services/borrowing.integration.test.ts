import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { communityToday, type ItemInput } from '@borrowcircle/shared';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/user.js';
import { Item } from '../models/item.js';
import { BorrowRequest } from '../models/borrow-request.js';
import { Reservation } from '../models/reservation.js';
import { createItem, archiveItem } from './item.service.js';
import { createRequest, actOnRequest } from './request.service.js';
import { createApp } from '../app.js';
import type { Environment } from '../config/env.js';
import supertest from 'supertest';

let database: MongoMemoryReplSet;
let environment: Environment;
let application: ReturnType<typeof createApp>;
let ownerId: string;
let borrowerId: string;
let otherId: string;
let itemId: string;
let passwordHash: string;
const password = 'Test-only-password-2026!';
const dates = () => ({ startDate: communityToday(), endDate: communityToday(), note: '' });
const input: ItemInput = {
  title: 'Test drill',
  description: 'A drill for isolated borrowing tests.',
  category: 'Tools',
  condition: 'Good',
  pickupArea: 'Community centre',
  imageUrl: '',
};

beforeAll(async () => {
  database = await MongoMemoryReplSet.create({
    instanceOpts: [{ launchTimeout: 60_000 }],
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const uri = database.getUri(`borrowcircle_test_${randomUUID().replaceAll('-', '')}`);
  // Tests create their own server and database; they never read MONGODB_URI from .env.
  await connectDatabase(uri);
  environment = {
    NODE_ENV: 'test',
    PORT: 4000,
    APP_ORIGIN: 'http://localhost:5173',
    MONGODB_URI: uri,
    SESSION_SECRET: 'isolated-test-secret-at-least-32-characters',
    TRUST_PROXY: '0',
  };
  passwordHash = await argon2.hash(password, { type: argon2.argon2id });
}, 120_000);

beforeEach(async () => {
  if (application) await application.store.close();
  for (const model of [User, Item, BorrowRequest, Reservation]) await model.deleteMany({});
  const people = await User.create([
    { name: 'Owner', email: 'owner@example.test', passwordHash },
    { name: 'Borrower', email: 'borrower@example.test', passwordHash },
    { name: 'Other', email: 'other@example.test', passwordHash },
  ]);
  const [owner, borrower, other] = people;
  if (!owner || !borrower || !other) throw new Error('Test fixture missing');
  ownerId = owner.id;
  borrowerId = borrower.id;
  otherId = other.id;
  itemId = (await createItem(input, ownerId)).id;
  application = createApp(environment);
});
afterAll(async () => {
  if (application) await application.store.close();
  await mongoose.disconnect();
  if (database) await database.stop();
});

describe('database-enforced borrowing lifecycle', () => {
  it('allows only one of two concurrent overlapping approvals, with no partial reservations', async () => {
    const first = await createRequest(itemId, dates(), borrowerId);
    const second = await createRequest(itemId, dates(), otherId);
    const outcomes = await Promise.allSettled([
      actOnRequest(first.id, 'approve', ownerId),
      actOnRequest(second.id, 'approve', ownerId),
    ]);
    expect(outcomes.filter((value) => value.status === 'fulfilled')).toHaveLength(1);
    const failure = outcomes.find((value) => value.status === 'rejected');
    expect(failure?.status === 'rejected' ? failure.reason : null).toMatchObject({ status: 409 });
    expect(await Reservation.countDocuments({ item: itemId })).toBe(1);
    expect(await BorrowRequest.countDocuments({ item: itemId, status: 'approved' })).toBe(1);
    expect(await BorrowRequest.countDocuments({ item: itemId, status: 'pending' })).toBe(1);
  });
  it('reserves every inclusive day and releases them when cancelled', async () => {
    const start = communityToday();
    const end = new Date(Date.parse(`${start}T00:00:00Z`) + 2 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const request = await createRequest(
      itemId,
      { startDate: start, endDate: end, note: '' },
      borrowerId,
    );
    await actOnRequest(request.id, 'approve', ownerId);
    expect(await Reservation.countDocuments({ request: request.id })).toBe(3);
    await actOnRequest(request.id, 'cancel', borrowerId);
    expect(await Reservation.countDocuments({ request: request.id })).toBe(0);
    expect((await BorrowRequest.findById(request.id))?.status).toBe('cancelled');
  });
  it('prevents simultaneous handovers and releases the active loan on return', async () => {
    const request = await createRequest(itemId, dates(), borrowerId);
    await actOnRequest(request.id, 'approve', ownerId);
    const results = await Promise.allSettled([
      actOnRequest(request.id, 'handover', ownerId),
      actOnRequest(request.id, 'handover', ownerId),
    ]);
    expect(results.filter((value) => value.status === 'fulfilled')).toHaveLength(1);
    expect((await Item.findById(itemId))?.activeLoan?.toString()).toBe(request.id);
    await expect(actOnRequest(request.id, 'cancel', borrowerId)).rejects.toMatchObject({
      status: 409,
    });
    await actOnRequest(request.id, 'return', ownerId);
    expect((await Item.findById(itemId))?.activeLoan).toBeNull();
    expect(await Reservation.countDocuments({ request: request.id })).toBe(0);
  });
  it('blocks a second active loan even if its approval has different dates', async () => {
    const request = await createRequest(itemId, dates(), borrowerId);
    await actOnRequest(request.id, 'approve', ownerId);
    await actOnRequest(request.id, 'handover', ownerId);
    // Simulate a previously borrowed item whose owner has not confirmed return.
    await Reservation.deleteMany({ request: request.id });
    const next = await createRequest(itemId, dates(), otherId);
    await actOnRequest(next.id, 'approve', ownerId);
    await expect(actOnRequest(next.id, 'handover', ownerId)).rejects.toMatchObject({ status: 409 });
    expect((await Item.findById(itemId))?.activeLoan?.toString()).toBe(request.id);
  });
  it('serializes approval versus archiving', async () => {
    const request = await createRequest(itemId, dates(), borrowerId);
    const results = await Promise.allSettled([
      actOnRequest(request.id, 'approve', ownerId),
      archiveItem(itemId, ownerId),
    ]);
    expect(results.filter((value) => value.status === 'fulfilled')).toHaveLength(1);
    const item = await Item.findById(itemId);
    const saved = await BorrowRequest.findById(request.id);
    if (item?.archived) {
      expect(saved?.status).toBe('rejected');
      expect(await Reservation.countDocuments({ item: itemId })).toBe(0);
    } else {
      expect(saved?.status).toBe('approved');
      expect(await Reservation.countDocuments({ item: itemId })).toBe(1);
    }
  });
  it('serializes request creation versus archive and preserves history', async () => {
    await Promise.allSettled([
      createRequest(itemId, dates(), borrowerId),
      archiveItem(itemId, ownerId),
    ]);
    expect((await Item.findById(itemId))?.archived).toBe(true);
    expect(await BorrowRequest.countDocuments({ item: itemId, status: 'pending' })).toBe(0);
  });
  it('enforces ownership and terminal transitions independently of UI', async () => {
    await expect(createRequest(itemId, dates(), ownerId)).rejects.toMatchObject({ status: 403 });
    const request = await createRequest(itemId, dates(), borrowerId);
    await expect(actOnRequest(request.id, 'approve', otherId)).rejects.toMatchObject({
      status: 403,
    });
    await expect(archiveItem(itemId, borrowerId)).rejects.toMatchObject({ status: 403 });
    await actOnRequest(request.id, 'reject', ownerId);
    await expect(actOnRequest(request.id, 'approve', ownerId)).rejects.toMatchObject({
      status: 409,
    });
  });
});

async function signedIn(email: string) {
  const agent = supertest.agent(application.app);
  const csrf = await agent.get('/api/auth/csrf').expect(200);
  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', String(csrf.body.token))
    .send({ email, password })
    .expect(200);
  return agent;
}
describe('HTTP authentication, validation, and CSRF', () => {
  it('registers, restores a session, rejects duplicate email and logs out', async () => {
    const agent = supertest.agent(application.app);
    const csrf = await agent.get('/api/auth/csrf');
    const registration = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', String(csrf.body.token))
      .send({ name: 'New member', email: 'New@example.test', password })
      .expect(201);
    expect(Object.keys(registration.body.user).sort()).toEqual(['id', 'name']);
    const restored = await agent.get('/api/auth/me').expect(200);
    expect(restored.body.user.name).toBe('New member');
    const nextToken = await agent.get('/api/auth/csrf');
    await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', String(nextToken.body.token))
      .send({ name: 'Duplicate', email: 'new@example.test', password })
      .expect(409);
    await agent
      .post('/api/auth/logout')
      .set('X-CSRF-Token', String(nextToken.body.token))
      .send({})
      .expect(204);
    expect((await agent.get('/api/auth/me')).body.user).toBeNull();
  });
  it('rejects unauthenticated mutations and requests with missing or invalid CSRF tokens', async () => {
    const agent = supertest.agent(application.app);
    await agent.post('/api/items').send(input).expect(403);
    const csrf = await agent.get('/api/auth/csrf');
    await agent
      .post('/api/items')
      .set('X-CSRF-Token', String(csrf.body.token))
      .send(input)
      .expect(401);
    await agent.post('/api/items').set('X-CSRF-Token', 'é'.repeat(64)).send(input).expect(403);
  });
  it('rejects cross-origin mutations, invalid dates, identifiers, and unknown writable fields', async () => {
    const agent = await signedIn('borrower@example.test');
    const csrf = await agent.get('/api/auth/csrf');
    await agent
      .post(`/api/items/${itemId}/requests`)
      .set('Origin', 'https://untrusted.example')
      .set('X-CSRF-Token', String(csrf.body.token))
      .send(dates())
      .expect(403);
    await agent
      .post(`/api/items/${itemId}/requests`)
      .set('X-CSRF-Token', String(csrf.body.token))
      .send({ ...dates(), endDate: '2026-02-30' })
      .expect(400);
    await agent
      .post('/api/items')
      .set('X-CSRF-Token', String(csrf.body.token))
      .send({ ...input, owner: ownerId })
      .expect(400);
    await agent.get('/api/items/not-an-id').expect(400);
    await agent.get('/api/items?limit=100').expect(400);
  });
  it('runs the authenticated create, edit, browse and archive flow', async () => {
    const agent = await signedIn('owner@example.test');
    const csrf = await agent.get('/api/auth/csrf');
    const created = await agent
      .post('/api/items')
      .set('X-CSRF-Token', String(csrf.body.token))
      .send({ ...input, title: 'A new tent' })
      .expect(201);
    const id = String(created.body.id);
    await agent
      .patch(`/api/items/${id}`)
      .set('X-CSRF-Token', String(csrf.body.token))
      .send({ ...input, title: 'Edited tent' })
      .expect(200);
    const list = await agent.get('/api/items?search=Edited&category=Tools').expect(200);
    expect(list.body.total).toBe(1);
    await agent
      .delete(`/api/items/${id}`)
      .set('X-CSRF-Token', String(csrf.body.token))
      .send({})
      .expect(204);
    await agent.get(`/api/items/${id}`).expect(404);
  });
});
