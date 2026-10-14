import mongoose from 'mongoose';
export async function isDatabaseReady(): Promise<boolean> {
  if (!mongoose.connection.db || mongoose.connection.readyState !== 1) return false;
  try {
    await mongoose.connection.db.admin().command({ ping: 1 }, { timeoutMS: 2000 });
    return true;
  } catch {
    return false;
  }
}
