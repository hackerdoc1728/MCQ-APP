// src/services/userService.js
/* eslint-disable */
import { pgQuery } from '../infra/pg.js';
import { cache } from '../infra/redis.js';

const TTL = 7 * 24 * 60 * 60; // 7 days

function keyBySub(sub) {
    return `user:google_sub:${sub}`;
}
function keyById(id) {
    return `user:id:${id}`;
}

/**
 * Upsert user by Google payload (Neon/Postgres) with Redis cache.
 */
export async function upsertUserFromGoogle(payload) {
    const { sub, email, name, picture } = payload;

    // ✅ 1) Redis fast path
    const cached = await cache.getJSON(keyBySub(sub));
    if (cached) return cached;

    // ✅ 2) DB upsert on cache miss
    const res = await pgQuery(
        `
    INSERT INTO users (google_sub, email, name, picture, last_login_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (google_sub)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      picture = EXCLUDED.picture,
      last_login_at = NOW()
    RETURNING id, google_sub, email, name, picture, created_at, last_login_at
    `,
        [sub, email, name, picture]
    );

    const user = res.rows[0];

    // ✅ 3) Cache both indexes
    await cache.setJSON(keyBySub(sub), user, TTL);
    await cache.setJSON(keyById(user.id), user, TTL);

    return user;
}

export async function getUserById(id) {
    // ✅ 1) Redis fast path
    const cached = await cache.getJSON(keyById(id));
    if (cached) return cached;

    // ✅ 2) DB fallback
    const res = await pgQuery(
        'SELECT id, google_sub, email, name, picture FROM users WHERE id = $1',
        [id]
    );
    const user = res.rows[0] || null;

    // ✅ 3) Cache
    if (user) {
        await cache.setJSON(keyById(id), user, TTL);
        await cache.setJSON(keyBySub(user.google_sub), user, TTL);
    }

    return user;
}
