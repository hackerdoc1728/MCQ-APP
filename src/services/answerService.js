/* eslint-disable */
import { pgQuery } from '../infra/pg.js';
import { cacheKeys, CACHE_TTL } from '../infra/cacheKeys.js';
import { cache } from '../infra/redis.js';

export async function getUserAnswer(userId, mcqId) {
    const key = cacheKeys.answer(userId, mcqId);

    const cached = await cache.getJSON(key);
    if (cached) return cached;

    const { rows } = await pgQuery(
        `
    SELECT user_id, mcq_id, last_answer, is_correct, attempts, last_seen_at, created_at
    FROM user_mcq_answers
    WHERE user_id = $1 AND mcq_id = $2
    `,
        [userId, mcqId]
    );

    const ans = rows[0] || null;
    if (ans) await cache.setJSON(key, ans, CACHE_TTL.answer);

    return ans;
}

export async function upsertUserAnswer(userId, mcqId, answer, is_correct) {
    const { rows } = await pgQuery(
        `
    INSERT INTO user_mcq_answers (
      user_id, mcq_id, last_answer, is_correct, attempts, last_seen_at, created_at
    )
    VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
    ON CONFLICT (user_id, mcq_id)
    DO UPDATE SET
      last_answer = EXCLUDED.last_answer,
      is_correct = EXCLUDED.is_correct,
      attempts = user_mcq_answers.attempts + 1,
      last_seen_at = NOW()
    RETURNING user_id, mcq_id, last_answer, is_correct, attempts, last_seen_at, created_at
    `,
        [userId, mcqId, answer, is_correct]
    );

    const result = rows[0];
    await cache.setJSON(cacheKeys.answer(userId, mcqId), result, CACHE_TTL.answer);

    return result;
}
