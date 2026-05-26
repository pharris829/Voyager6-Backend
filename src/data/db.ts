import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

export const db = new Pool({ connectionString: config.databaseUrl });

db.on('error', (err) => logger.error('Unexpected DB error', err));

export async function connectDb(): Promise<void> {
  const client = await db.connect();
  logger.info('PostgreSQL connected');
  client.release();
}
