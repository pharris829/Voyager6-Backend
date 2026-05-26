import fs from 'fs';
import path from 'path';
import { db, connectDb } from '../db';
import { logger } from '../../utils/logger';

async function runMigrations() {
  await connectDb();

  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        SERIAL PRIMARY KEY,
      filename  TEXT UNIQUE NOT NULL,
      run_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const schemaDir = path.join(__dirname, '../schema');
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await db.query('SELECT id FROM _migrations WHERE filename = $1', [file]);
    if (rows.length) continue;

    const sql = fs.readFileSync(path.join(schemaDir, file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    logger.info(`Ran migration: ${file}`);
  }

  logger.info('All migrations complete');
  await db.end();
}

runMigrations().catch((err) => {
  logger.error(err);
  process.exit(1);
});
