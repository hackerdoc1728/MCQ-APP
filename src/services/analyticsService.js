// src/services/analyticsService.js
/* eslint-disable */
import { pgQuery } from '../infra/pg.js';
import { getAllMcqs } from './mcqLoader.js';

export async function getUserSummary(userId) {
    const totalRes = await pgQuery(
        `
        SELECT
          COUNT(*)::int AS total_answered,
          COALESCE(SUM(CASE WHEN is_correct IS TRUE THEN 1 ELSE 0 END), 0)::int AS total_correct,
          MIN(created_at) AS first_seen,
          MAX(last_seen_at) AS last_seen
        FROM user_mcq_answers
        WHERE user_id = $1
        `,
        [userId]
    );

    const row = totalRes.rows[0] || {
        total_answered: 0,
        total_correct: 0,
        first_seen: null,
        last_seen: null,
    };

    const totalAnswered = row.total_answered || 0;
    const totalCorrect = row.total_correct || 0;
    const accuracy =
        totalAnswered > 0
            ? Math.round((totalCorrect / totalAnswered) * 100)
            : 0;

    return {
        totalAnswered,
        totalCorrect,
        accuracy,
        firstSeen: row.first_seen,
        lastSeen: row.last_seen,
    };
}

export async function getUserTopicStats(userId) {
    const answersRes = await pgQuery(
        `
        SELECT mcq_id, is_correct
        FROM user_mcq_answers
        WHERE user_id = $1
        `,
        [userId]
    );
    const answers = answersRes.rows;
    if (!answers.length) return [];

    const mcqs = await getAllMcqs();
    const mcqById = new Map();
    mcqs.forEach((m) => mcqById.set(m.mcq_id, m));

    const topicStats = new Map();

    for (const ans of answers) {
        const meta = mcqById.get(ans.mcq_id);
        const topic = (meta && meta.topic) || 'Unknown';

        if (!topicStats.has(topic)) {
            topicStats.set(topic, { topic, answered: 0, correct: 0 });
        }

        const entry = topicStats.get(topic);
        entry.answered += 1;
        if (ans.is_correct === true) entry.correct += 1;
    }

    const result = [];
    for (const entry of topicStats.values()) {
        const accuracy =
            entry.answered > 0
                ? Math.round((entry.correct / entry.answered) * 100)
                : 0;
        result.push({
            topic: entry.topic,
            answered: entry.answered,
            correct: entry.correct,
            accuracy,
        });
    }

    result.sort((a, b) => b.answered - a.answered);
    return result;
}

export async function getUserDailyTimeline(userId, days = 30) {
    const clampedDays = Math.max(1, Math.min(days, 365));

    const res = await pgQuery(
        `
        SELECT
          DATE_TRUNC('day', last_seen_at)::date AS day,
          COUNT(*)::int AS answered,
          COALESCE(SUM(CASE WHEN is_correct IS TRUE THEN 1 ELSE 0 END), 0)::int AS correct
        FROM user_mcq_answers
        WHERE user_id = $1
          AND last_seen_at >= NOW() - $2::interval
        GROUP BY day
        ORDER BY day
        `,
        [userId, `${clampedDays} days`]
    );

    return res.rows.map((row) => {
        const answered = row.answered || 0;
        const correct = row.correct || 0;
        const accuracy =
            answered > 0
                ? Math.round((correct / answered) * 100)
                : 0;

        return {
            date: row.day,
            answered,
            correct,
            accuracy,
        };
    });
}
