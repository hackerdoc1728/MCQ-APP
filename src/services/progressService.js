// src/routes/progress.js
/* eslint-disable */
import { pgQuery } from '../infra/pg.js';
import { cache } from '../infra/redis.js';
import { cacheKeys, CACHE_TTL } from '../infra/cacheKeys.js';

// You can tune this: how many recent answers to show on dashboard
const RECENT_LIMIT = 50;

export async function getUserProgress(userId) {
    const key = cacheKeys.userProgress(userId);

    // 1) Redis fast-path
    const cached = await cache.getJSON(key);
    if (cached) return cached;

    // 2) DB fallback: fetch state + recent answers
    const stateRes = await pgQuery(
        `SELECT user_id, last_mcq_id, last_page, last_updated_at
     FROM user_state
     WHERE user_id = $1`,
        [userId]
    );

    const answersRes = await pgQuery(
        `SELECT user_id, mcq_id, last_answer, is_correct, attempts, last_seen_at, created_at
     FROM user_mcq_answers
     WHERE user_id = $1
     ORDER BY last_seen_at DESC
     LIMIT $2`,
        [userId, RECENT_LIMIT]
    );

    const data = {
        state: stateRes.rows[0] || null,
        recentAnswers: answersRes.rows || [],
    };

    // 3) Cache result
    await cache.setJSON(key, data, CACHE_TTL.userProgress);

    return data;
}

/**
 * saveMcqAnswer: write-through to DB + update Redis.
 * Called by POST /api/progress
 */
export async function saveMcqAnswer({ userId, mcqId, answer, isCorrect, currentPage }) {
    // --- 1) Upsert answer in DB (attempts increments on conflict)
    const ansRes = await pgQuery(
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
        [userId, mcqId, answer, isCorrect]
    );

    const savedAnswer = ansRes.rows[0];

    // --- 2) Upsert user_state (if currentPage provided, store it; always store last_mcq_id)
    let savedState = null;
    if (currentPage !== null && currentPage !== undefined) {
        const stateRes = await pgQuery(
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
            [userId, mcqId, currentPage]
        );
        savedState = stateRes.rows[0];
    } else {
        // if you still want to update last_mcq_id even without page:
        const stateRes = await pgQuery(
            `
      INSERT INTO user_state (user_id, last_mcq_id, last_page, last_updated_at)
      VALUES ($1, $2, COALESCE((SELECT last_page FROM user_state WHERE user_id=$1), 0), NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        last_mcq_id = EXCLUDED.last_mcq_id,
        last_updated_at = NOW()
      RETURNING user_id, last_mcq_id, last_page, last_updated_at
      `,
            [userId, mcqId]
        );
        savedState = stateRes.rows[0];
    }

    // --- 3) Update fine-grained caches
    await cache.setJSON(cacheKeys.answer(userId, mcqId), savedAnswer, CACHE_TTL.answer);
    await cache.setJSON(cacheKeys.userState(userId), savedState, CACHE_TTL.userState);

    // --- 4) Update /api/progress aggregate cache (so GET becomes instant)
    // simplest approach: just delete aggregate so next GET rebuilds
    await cache.del(cacheKeys.userProgress(userId));

    // alternatively, you can “patch” the cached progress object; delete is simpler + safe
    return { savedAnswer, savedState };
}
