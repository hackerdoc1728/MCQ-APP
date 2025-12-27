// src/services/mcqLoader.js
/* eslint-disable */
import config from "../../config/config.js";
import { redisClient } from "../infra/redis.js";
import { logger } from "../infra/logger.js";
import { pgQuery } from "../infra/pg.js"; // <-- use your Neon pg pool helper (you already have this pattern)

// Cache keys
function pageKey(page, limit) {
    return `mcq:page:${page}:${limit}`;
}
const COUNT_KEY = "mcq:count:published";

// Build full URL for R2 object keys
function toAssetUrl(raw) {
    if (!raw) return "";
    const s = String(raw).trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (config.r2BaseUrl) {
        return `${config.r2BaseUrl.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
    }
    return s;
}

// Map Neon row → your existing API response shape
function rowToApiMcq(row, index1Based) {
    return {
        mcq_id: row.mcq_id,
        correct: row.correct_option ? String(row.correct_option).trim() : null,

        question: {
            text: row.stem_text || null,
            images: row.stem_image_key ? [toAssetUrl(row.stem_image_key)] : [],
        },

        options: {
            A: { text: row.option_a_text || null, images: row.option_a_image_key ? [toAssetUrl(row.option_a_image_key)] : [] },
            B: { text: row.option_b_text || null, images: row.option_b_image_key ? [toAssetUrl(row.option_b_image_key)] : [] },
            C: { text: row.option_c_text || null, images: row.option_c_image_key ? [toAssetUrl(row.option_c_image_key)] : [] },
            D: { text: row.option_d_text || null, images: row.option_d_image_key ? [toAssetUrl(row.option_d_image_key)] : [] },
        },

        explanation: {
            text: row.explanation_text || null,
            images: row.explanation_image_key ? [toAssetUrl(row.explanation_image_key)] : [],
        },

        index: index1Based,
    };
}

// ---- PUBLIC API (same exports as your old file) ----

// No-op now (we do NOT warm from Sheets anymore)
export async function warmMcqCache() {
    logger.info("warmMcqCache skipped (Neon-backed).");
    return { ok: true, skipped: true };
}

// No longer “getAllMcqs” from Redis (too heavy). Keep for compatibility if anything calls it.
export async function getAllMcqs() {
    // If you truly need it later, implement a Neon streaming fetch.
    // For now, avoid loading entire bank into memory.
    throw new Error("getAllMcqs is disabled in Neon mode. Use getMcqPage().");
}

async function getPublishedCount() {
    // Cache count briefly (changes only when publish/sync happens)
    const cached = await redisClient.get(COUNT_KEY);
    if (cached) return parseInt(cached, 10);

    const res = await pgQuery(
        `SELECT COUNT(*)::int AS cnt FROM mcqs WHERE status='published'`,
        []
    );

    const cnt = res.rows?.[0]?.cnt ?? 0;
    await redisClient.set(COUNT_KEY, String(cnt), { EX: 60 }); // 60s TTL (admin publish will also invalidate)
    return cnt;
}

export async function getMcqPage(page = 1, limit = 1) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, parseInt(limit, 10) || 1);

    const cacheKey = pageKey(safePage, safeLimit);
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const offset = (safePage - 1) * safeLimit;

    // Fetch rows from Neon (published only)
    const rowsRes = await pgQuery(
        `
    SELECT
      mcq_id, correct_option,
      stem_text, stem_image_key,
      option_a_text, option_a_image_key,
      option_b_text, option_b_image_key,
      option_c_text, option_c_image_key,
      option_d_text, option_d_image_key,
      explanation_text, explanation_image_key
    FROM mcqs
    WHERE status='published'
    ORDER BY updated_at DESC NULLS LAST
    LIMIT $1 OFFSET $2
    `,
        [safeLimit, offset]
    );

    const total = await getPublishedCount();

    const mcqs = (rowsRes.rows || []).map((row, i) =>
        rowToApiMcq(row, offset + i + 1)
    );

    const out = { mcqs, totalMCQs: total };

    // Cache page briefly
    await redisClient.set(cacheKey, JSON.stringify(out), { EX: 60 }); // 60s
    return out;
}
