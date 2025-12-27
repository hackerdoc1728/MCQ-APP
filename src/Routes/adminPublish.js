import express from "express";
import { publishOne } from "../services/mcqPublish.js";

export const adminPublishRouter = express.Router();

// POST /api/admin/mcq/publish { mcq_id }
adminPublishRouter.post("/mcq/publish", async (req, res) => {
    const mcq_id = String(req.body?.mcq_id || "").trim();
    if (!mcq_id) return res.status(400).json({ ok: false, error: "mcq_id required" });

    const out = await publishOne({ mcq_id });
    res.json(out);
});
