/* eslint-disable */
import { pgQuery } from '../infra/pg.js';
import { cacheKeys, CACHE_TTL } from '../infra/cacheKeys.js';
import { cache } from '../infra/redis.js';

export async function getUserState(userId) {
    const key = cacheKeys.userState(userId);

    const cached = await cache.getJSON(key);
    if (cached) return cached;

    const { rows } = await pgQuery(
        'SELECT user_id, last_mcq_id, last_page, last_updated_at FROM user_state WHERE user_id = $1',
        [userId]
    );

    const state = rows[0] || null;
    if (state) await cache.setJSON(key, state, CACHE_TTL.userState);

    return state;
}

export async function upsertUserState(userId, last_mcq_id, last_page) {
    const { rows } = await pgQuery(
        `
    INSERT INTO user_state (user_id, last_mcq_id, last_page, last_updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      last_mcq_id = EXCLUDED.last_mcq_id,
      last_page = EXCLUDED.last_page,
      last_updated_at = NOW()
    RETURNING user_id, last_mcq_id, last_page, last_updated_at
    `,
        [userId, last_mcq_id, last_page]
    );

    const state = rows[0];
    await cache.setJSON(cacheKeys.userState(userId), state, CACHE_TTL.userState);

    return state;
}
