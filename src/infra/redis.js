// src/infra/redis.js
/* eslint-disable */
import redisClientLib from 'redis';
import { logger } from './logger.js';

export const redisClient = redisClientLib.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

/* ============================
   Cache wrapper + metrics
   ============================ */

export const cache = {
    stats: {
        get: { hit: 0, miss: 0, err: 0 },
        set: { ok: 0, err: 0 },
        del: { ok: 0, err: 0 },
    },

    async getJSON(key) {
        try {
            const raw = await redisClient.get(key);
            if (raw) {
                this.stats.get.hit++;
                return JSON.parse(raw);
            }
            this.stats.get.miss++;
            return null;
        } catch (err) {
            this.stats.get.err++;
            logger.warn(`Redis GET error for ${key}: ${err.message}`);
            return null;
        }
    },

    async setJSON(key, value, ttlSeconds) {
        try {
            const raw = JSON.stringify(value);
            if (ttlSeconds) {
                await redisClient.set(key, raw, { EX: ttlSeconds });
            } else {
                await redisClient.set(key, raw);
            }
            this.stats.set.ok++;
            return true;
        } catch (err) {
            this.stats.set.err++;
            logger.warn(`Redis SET error for ${key}: ${err.message}`);
            return false;
        }
    },

    async del(key) {
        try {
            await redisClient.del(key);
            this.stats.del.ok++;
            return true;
        } catch (err) {
            this.stats.del.err++;
            logger.warn(`Redis DEL error for ${key}: ${err.message}`);
            return false;
        }
    },
};

/* ============================
   Init + metrics logger
   ============================ */

export async function initRedis() {
    redisClient.on('error', (err) =>
        logger.error(`Redis error: ${err.message}`)
    );

    await redisClient.connect();
    logger.info('Connected to Redis');

    // Log cache metrics every 60s
    setInterval(() => {
        const s = cache.stats;
        logger.info(
            `Redis metrics | GET hit=${s.get.hit} miss=${s.get.miss} err=${s.get.err} | SET ok=${s.set.ok} err=${s.set.err} | DEL ok=${s.del.ok} err=${s.del.err}`
        );
    }, 60_000).unref?.();
}

/* ============================
   Utilities
   ============================ */

export async function deletePattern(pattern) {
    try {
        const keys = [];
        for await (const key of redisClient.scanIterator({
            MATCH: pattern,
            COUNT: 100,
        })) {
            keys.push(key);
        }

        if (keys.length) {
            await redisClient.del(...keys);
        }
    } catch (err) {
        logger.error(
            `Error deleting keys for pattern ${pattern}: ${err.message}`
        );
    }
}

// Shared cache TTLs
export const PAGE_CACHE_TTL = 300; // 5 minutes
