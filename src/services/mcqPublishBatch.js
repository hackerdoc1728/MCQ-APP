import crypto from "crypto";
import { readAllSheetRows, rowToObject, setCell, nowIso } from "./sheets.js";
import { upsertPublishedMcqToNeon } from "./mcqNeon.js";
import { cache, deletePattern } from "../infra/redis.js";

function commitHash() {
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

export async function publishBatch({ limit = 10, dryRun = false } = {}) {
    const values = await readAllSheetRows();
    if (values.length < 2) {
        return { ok: true, dryRun, limit, published_count: 0, published: [], skipped: 0, errors: [] };
    }

    // Collect READY rows, starting from bottom (latest appended = newest)
    const readyRows = [];
    for (let i = values.length - 1; i >= 1; i--) {
        const row = values[i] || [];
        const obj = rowToObject(row);
        const status = String(obj.status || "").trim().toLowerCase();

        if (status === "ready" && obj.mcq_id) {
            readyRows.push({ rowNumber: i + 1, obj });
            if (readyRows.length >= limit) break;
        }
    }

    const commit_hash = commitHash();
    const published_batch = batchId();
    const updated = nowIso();

    const published = [];
    const errors = [];
    let skipped = 0;

    for (const r of readyRows) {
        try {
            validatePublishable(r.obj);

            if (!dryRun) {
                await upsertPublishedMcqToNeon({
                    mcq_id: r.obj.mcq_id,
                    payload_json: {
                        ...r.obj,
                        status: "published",
                        commit_hash,
                        published_batch,
                        updated_at: updated,
                        is_latest: true,
                    },
                    commit_hash,
                    published_batch,
                });

                // Update sheet metadata
                await setCell(r.rowNumber, "status", "published");
                await setCell(r.rowNumber, "updated_at", updated);
                await setCell(r.rowNumber, "commit_hash", commit_hash);
                await setCell(r.rowNumber, "published_batch", published_batch);
                await setCell(r.rowNumber, "is_latest", true);
            }

            published.push(r.obj.mcq_id);
        } catch (e) {
            errors.push({ mcq_id: r.obj.mcq_id, rowNumber: r.rowNumber, error: e?.message || String(e) });
        }
    }

    // Invalidate caches once at end
    if (!dryRun && published.length) {
        await cache.del("mcq:count:published");
        await deletePattern("mcq:page:*");
        await deletePattern("mcq:byId:*");
        await deletePattern("mcq:list:published:*");
    }

    return {
        ok: true,
        dryRun,
        limit,
        found_ready: readyRows.length,
        published_count: published.length,
        published,
        skipped,
        commit_hash,
        published_batch,
        updated_at: updated,
        errors,
        invalidated: dryRun || !published.length
            ? []
            : ["mcq:count:published", "mcq:page:*", "mcq:byId:*", "mcq:list:published:*"],
    };
}
