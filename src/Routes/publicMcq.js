import express from "express";
import { cache } from "../infra/redis.js";
import { getMcqFromNeon, listPublished } from "../services/mcqNeon.js";

export const publicMcqRouter = express.Router();

// GET /api/mcq/:id
publicMcqRouter.get("/:id", async (req, res) => {
    const mcq_id = String(req.params.id || "").trim();
    const key = `mcq:byId:${mcq_id}`;

    const cached = await cache.getJSON(key);
    if (cached) return res.json({ ok: true, source: "redis", mcq: cached });

    const row = await getMcqFromNeon(mcq_id);
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });

    // row.payload_json is what you serve (or keep wrapper)
    await cache.setJSON(key, row, 3600);
    return res.json({ ok: true, source: "neon", mcq: row });
});

// GET /api/mcq?limit=20&offset=0
publicMcqRouter.get("/", async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
    const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);

    const key = `mcq:page:${limit}:${offset}`; // aligns with your invalidation pattern
    const cached = await cache.getJSON(key);
    if (cached) return res.json({ ok: true, source: "redis", items: cached });

    const items = await listPublished({ limit, offset });
    await cache.setJSON(key, items, 300);

    return res.json({ ok: true, source: "neon", items });
});
