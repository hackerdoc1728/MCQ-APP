import redisClientLib from 'redis';
import config from '../config/config.js';
import util from 'util';
import logger from '../middleware/logger.js';

const redisClient = redisClientLib.createClient({ url: config.redisUrl });
redisClient.on('error', (err) => logger.error('Redis error:', err));

(async () => {
    try {
        await redisClient.connect();
        logger.info('Connected to Redis');
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        process.exit(1);
    }
})();

export const getAsync = util.promisify(redisClient.get).bind(redisClient);
export const setAsync = util.promisify(redisClient.set).bind(redisClient);

export default redisClient;