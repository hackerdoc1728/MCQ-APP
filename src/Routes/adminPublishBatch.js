import express from "express";
import { publishBatch } from "../services/mcqPublishBatch.js";

export const adminPublishBatchRouter = express.Router();

// POST /api/admin/mcq/publish-batch
// Body: { limit?: number, dryRun?: boolean, confirm?: "PUBLISH" }
adminPublishBatchRouter.post("/mcq/publish-batch", async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.body?.limit ?? "10", 10), 1), 200);
    const dryRun = Boolean(req.body?.dryRun);

    // 🔒 SAFETY GUARD (important)
    const confirm = String(req.body?.confirm || "").trim();
    if (!dryRun && confirm !== "PUBLISH") {
        return res.status(400).json({
            ok: false,
            error: 'Missing confirm. Send {"confirm":"PUBLISH"} to run non-dry batch publish.'
        });
    }

    const out = await publishBatch({ limit, dryRun });
    res.json(out);
});
