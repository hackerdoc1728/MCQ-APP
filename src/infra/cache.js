/* eslint-disable */
import { logger } from './logger.js';

export function createCache(redis) {
    const stats = {
        get: { hit: 0, miss: 0, err: 0 },
        set: { ok: 0, err: 0 },
        del: { ok: 0, err: 0 },
    };

    async function getJSON(key) {
        try {
            const raw = await redis.get(key);
            if (raw) {
                stats.get.hit += 1;
                return JSON.parse(raw);
            }
            stats.get.miss += 1;
            return null;
        } catch (e) {
            stats.get.err += 1;
            logger.warn(`Redis GET error for ${key}: ${e.message}`);
            return null;
        }
    }

    async function setJSON(key, value, ttlSeconds) {
        try {
            const raw = JSON.stringify(value);
            if (ttlSeconds) {
                await redis.set(key, raw, { EX: ttlSeconds });
            } else {
                await redis.set(key, raw);
            }
            stats.set.ok += 1;
            return true;
        } catch (e) {
            stats.set.err += 1;
            logger.warn(`Redis SET error for ${key}: ${e.message}`);
            return false;
        }
    }

    async function del(key) {
        try {
            await redis.del(key);
            stats.del.ok += 1;
            return true;
        } catch (e) {
            stats.del.err += 1;
            logger.warn(`Redis DEL error for ${key}: ${e.message}`);
            return false;
        }
    }

    // log a compact summary periodically
    function startMetricsLogger({ intervalMs = 60000 } = {}) {
        setInterval(() => {
            logger.info(
                `Redis metrics | GET hit=${stats.get.hit} miss=${stats.get.miss} err=${stats.get.err} | SET ok=${stats.set.ok} err=${stats.set.err} | DEL ok=${stats.del.ok} err=${stats.del.err}`
            );
        }, intervalMs).unref?.(); // doesn't keep process alive
    }

    return { getJSON, setJSON, del, stats, startMetricsLogger };
}
