import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const content = `NODE_ENV=development\nPORT=4000\nAPP_ORIGIN=http://localhost:5173\nMONGODB_URI=mongodb://127.0.0.1:27018/borrowcircle?replicaSet=borrowcircle\nSESSION_SECRET=${randomBytes(48).toString('hex')}\nDEMO_PASSWORD=BorrowCircle-demo-2026!\nTRUST_PROXY=0\n`;
try {
  await writeFile(fileURLToPath(new URL('../../.env', import.meta.url)), content, {
    flag: 'wx',
    mode: 0o600,
  });
  console.info(
    'Created ignored server/.env with a random development secret. No credentials were printed.',
  );
} catch (error) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'EEXIST')
    console.info('Existing server/.env preserved.');
  else throw error;
}
