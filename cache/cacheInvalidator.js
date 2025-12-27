import chokidar from 'chokidar';
import path from 'path';
import redisClient from './redis.js';
import logger from '../middleware/logger.js';

const directoriesToWatch = [
    'public/musings',
    'public/MCQ',
    'public/synapse-speaks'
];

const watcher = chokidar.watch(directoriesToWatch, {
    persistent: true,
    ignoreInitial: true,
    depth: 0,
    awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
    },
});

const invalidateCache = async () => {
    try {
        const keys = await redisClient.keys('cachedPage:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.info('All cached pages invalidated.');
        }
    } catch (err) {
        logger.error('Error invalidating cache:', err);
    }
};

watcher.on('add', (filePath) => {
    if (path.extname(filePath) === '.html') {
        logger.info(`New HTML file added: ${filePath}. Invalidating Redis cache.`);
        invalidateCache();
    }
});

watcher.on('unlink', (filePath) => {
    if (path.extname(filePath) === '.html') {
        logger.info(`HTML file removed: ${filePath}. Invalidating Redis cache.`);
        invalidateCache();
    }
});

watcher.on('change', (filePath) => {
    if (path.extname(filePath) === '.html') {
        logger.info(`HTML file changed: ${filePath}. Invalidating Redis cache.`);
        invalidateCache();
    }
});

watcher.on('error', (error) => {
    logger.error('Watcher error:', error);
});

export default watcher;