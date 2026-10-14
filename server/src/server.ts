import mongoose from 'mongoose';
import { readEnvironment } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';

const environment = readEnvironment();
await connectDatabase(
  environment.MONGODB_URI,
  environment.NODE_ENV === 'development' ? 65_000 : 5000,
);
const { app, store } = createApp(environment);
const host = environment.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
const server = app.listen(environment.PORT, host, () =>
  console.info(`BorrowCircle API listening on port ${environment.PORT}`),
);
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await store.close();
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
