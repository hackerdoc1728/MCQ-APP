// server.js
/* eslint-disable */
import 'dotenv/config';
import cluster from 'cluster';
import os from 'os';

import { createApp } from './src/app.js';
import { logger } from './src/infra/logger.js';
import { pgPool } from './src/infra/pg.js';
import { warmMcqCache } from './src/services/mcqLoader.js';
// If your Redis client needs explicit init, uncomment and use this:
// import { initRedis } from './src/infra/redis.js';

const port = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startWorker() {
    try {
        // 🔹 If you have an explicit Redis init function, call it here
        // await initRedis();

        // 🔹 Warm MCQ cache (Google Sheets → Redis) at worker startup
        try {
            await warmMcqCache();
            logger.info('MCQ cache warmed successfully');
        } catch (err) {
            logger.error(
                `Failed to warm MCQ cache at startup: ${err.message}`
            );
            // Not fatal: you *could* allow lazy warming on first /api/mcq call
        }

        const app = await createApp();

        const server = app.listen(port, () => {
            logger.info(
                `Worker process ${process.pid} running on http://localhost:${port} (ENV: ${NODE_ENV})`
            );
        });

        // 🔹 Graceful shutdown for this worker
        const shutdown = (signal) => {
            return () => {
                logger.info(
                    `${signal} received in worker ${process.pid}. Shutting down gracefully...`
                );

                server.close(async () => {
                    logger.info('HTTP server closed');

                    try {
                        await pgPool.end();
                        logger.info('Neon PG pool closed');
                    } catch (err) {
                        logger.error(
                            `Error closing Neon PG pool: ${err.message}`
                        );
                    }

                    process.exit(0);
                });

                // Failsafe
                setTimeout(() => {
                    logger.error(
                        'Forceful shutdown: connections did not close in time'
                    );
                    process.exit(1);
                }, 10_000);
            };
        };

        process.on('SIGINT', shutdown('SIGINT'));
        process.on('SIGTERM', shutdown('SIGTERM'));
    } catch (err) {
        logger.error(`Failed to start worker app: ${err.message}`);
        process.exit(1);
    }
}

if (NODE_ENV !== 'development' && cluster.isPrimary) {
    logger.info(`Primary process ${process.pid} is running`);
    const numCPUs = os.cpus().length;

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        logger.error(`Worker ${worker.process.pid} died. Forking a new worker.`);
        cluster.fork();
    });
} else {
    // Development OR worker process
    startWorker();
}
