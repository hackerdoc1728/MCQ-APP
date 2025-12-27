import crypto from "crypto";
import { findSingleRowByMcqId, rowToObject, setCell, nowIso } from "./sheets.js";
import { upsertPublishedMcqToNeon } from "./mcqNeon.js";
import { cache, deletePattern } from "../infra/redis.js";

function commitHash() {
    // short & stable enough
    return "c_" + new Date().toISOString().replace(/[-:.TZ]/g, "") + "_" + crypto.randomBytes(4).toString("hex");
}
function batchId() {
    return "b_" + new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function hasContent(text, key) {
    return Boolean(String(text || "").trim() || String(key || "").trim());
}

function validatePublishable(mcq) {
    if (!mcq.mcq_id) throw new Error("mcq_id missing");
    if (!hasContent(mcq.stem_text, mcq.stem_image_key)) throw new Error("Stem must have text or image");

    const c = String(mcq.correct_option || "").toUpperCase();
    if (!["A", "B", "C", "D"].includes(c)) throw new Error("correct_option must be A/B/C/D");

    if (!hasContent(mcq.option_a_text, mcq.option_a_image_key)) throw new Error("Option A missing");
    if (!hasContent(mcq.option_b_text, mcq.option_b_image_key)) throw new Error("Option B missing");
    if (!hasContent(mcq.option_c_text, mcq.option_c_image_key)) throw new Error("Option C missing");
    if (!hasContent(mcq.option_d_text, mcq.option_d_image_key)) throw new Error("Option D missing");

    if (!hasContent(mcq.explanation_text, mcq.explanation_image_key)) throw new Error("Explanation must have text or image");
}

export async function publishOne({ mcq_id }) {
    // 1) Read from Sheets (staging source)
    const found = await findSingleRowByMcqId(mcq_id);
    if (!found) return { ok: false, error: `Not found in sheet: ${mcq_id}` };

    const mcq = rowToObject(found.row);

    // (Recommended) require ready before publish
    if (String(mcq.status || "").trim() !== "ready") {
        return { ok: false, error: `MCQ must be status=ready to publish (found: ${mcq.status || "empty"})` };
    }

    // 2) Validate
    validatePublishable(mcq);

    // 3) Set publish metadata
    const ch = commitHash();
    const pb = batchId();
    const updated = nowIso();

    // 4) Upsert into Neon (published-only)
    await upsertPublishedMcqToNeon({
        mcq_id,
        payload_json: {
            ...mcq,
            status: "published",
            commit_hash: ch,
            published_batch: pb,
            updated_at: updated,
            is_latest: true,
        },
        commit_hash: ch,
        published_batch: pb,
    });

    // 5) Update sheet metadata (so editor sees it)
    await setCell(found.rowNumber, "status", "published");
    await setCell(found.rowNumber, "updated_at", updated);
    await setCell(found.rowNumber, "commit_hash", ch);
    await setCell(found.rowNumber, "published_batch", pb);
    await setCell(found.rowNumber, "is_latest", true);

    // 6) Redis invalidation (your agreed keys)
    await cache.del("mcq:count:published");
    await deletePattern("mcq:page:*");
    await deletePattern("mcq:byId:*");
    await deletePattern("mcq:list:published:*");

    return {
        ok: true,
        mcq_id,
        commit_hash: ch,
        published_batch: pb,
        invalidated: ["mcq:count:published", "mcq:page:*", "mcq:byId:*", "mcq:list:published:*"],
    };
}
