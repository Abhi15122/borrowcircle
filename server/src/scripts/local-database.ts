import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

// This helper runs a real mongod replica set using an ignored, persistent data directory.
const dbPath = fileURLToPath(new URL('../../.data/db/', import.meta.url));
await mkdir(dbPath, { recursive: true });
const database = await MongoMemoryReplSet.create({
  instanceOpts: [{ port: 27018, dbPath, launchTimeout: 60_000 }],
  replSet: { count: 1, name: 'borrowcircle', storageEngine: 'wiredTiger' },
});
console.info('Local MongoDB replica set ready on port 27018 (persistent development data)');
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  await database.stop({ doCleanup: false, force: false });
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
