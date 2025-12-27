// src/middleware/logging.js
/* eslint-disable */
import { logger } from '../infra/logger.js';

export function setupLogging(app) {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
}
