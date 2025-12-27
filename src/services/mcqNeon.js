import { pgQuery } from "../infra/pg.js";

// You already allocate mcq_num in allocateMcqId(), so we can parse too if needed.
function parseMcqNum(mcq_id) {
    const m = String(mcq_id || "").match(/^NEURO_(\d{6})$/);
    if (!m) throw new Error(`Invalid mcq_id: ${mcq_id}`);
    return Number(m[1]);
}

// Option A: Neon stores ONLY published MCQs
export async function upsertPublishedMcqToNeon({ mcq_id, payload_json, commit_hash, published_batch }) {
    const mcq_num = parseMcqNum(mcq_id);

    await pgQuery(
        `
    INSERT INTO mcq (mcq_num, mcq_id, status, is_latest, payload_json, commit_hash, published_batch)
    VALUES ($1, $2, 'published', true, $3, $4, $5)
    ON CONFLICT (mcq_num) DO UPDATE SET
      mcq_id = EXCLUDED.mcq_id,
      status = 'published',
      is_latest = true,
      payload_json = EXCLUDED.payload_json,
      commit_hash = EXCLUDED.commit_hash,
      published_batch = EXCLUDED.published_batch,
      updated_at = now()
    `,
        [mcq_num, mcq_id, payload_json, commit_hash || null, published_batch || null]
    );
}

export async function getMcqFromNeon(mcq_id) {
    const res = await pgQuery(
        `
    SELECT mcq_id, mcq_num, payload_json, updated_at, commit_hash, published_batch
    FROM mcq
    WHERE mcq_id=$1 AND status='published' AND is_latest=true
    `,
        [mcq_id]
    );
    return res.rows[0] || null;
}

// OFFSET paging
export async function listPublished({ limit = 20, offset = 0 } = {}) {
    const res = await pgQuery(
        `
    SELECT mcq_id, payload_json, updated_at
    FROM mcq
    WHERE status='published' AND is_latest=true
    ORDER BY mcq_num ASC
    LIMIT $1 OFFSET $2
    `,
        [limit, offset]
    );
    return res.rows;
}
