// src/infra/pg.js
/* eslint-disable */
import pg from 'pg';
import config from '../../config/config.js';
import { logger } from './logger.js';

const { Pool } = pg;

if (!config.neonDatabaseUrl) {
    // eslint-disable-next-line no-console
    console.error('NEON_DATABASE_URL is not set in env/config');
}

export const pgPool = new Pool({
    connectionString: config.neonDatabaseUrl,
    ssl: config.nodeEnv === 'production'
        ? { rejectUnauthorized: false }
        : false,
});
pgPool.on('error', (err) => {
    logger.error(`Unexpected Postgres error: ${err.stack || err}`);
});

export async function pgQuery(text, params) {
    const start = Date.now();
    const res = await pgPool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 300) {
        logger.warn(`Slow PG query (${duration} ms): ${text}`);
    }
    return res;
}
