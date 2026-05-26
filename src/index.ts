import { config } from './config';
import app from './app';
import { connectDb } from './data/db';
import { registerActivityListeners } from './events/activityLogger';
import { startWsServer } from './events/wsServer';
import { logger } from './utils/logger';

async function main() {
  await connectDb();

  registerActivityListeners();
  startWsServer();

  app.listen(config.port, () => {
    logger.info(`Voyager6 API running on port ${config.port} [${config.nodeEnv}]`);
  });
}

main().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
