import express from "express";
import multer from "multer";
import { z } from "zod";
import { appendMcqRow } from "../services/sheets.js";
import { uploadImageAsWebp } from "../services/images.js";
import { allocateMcqId } from "../services/mcqId.js";

export const adminMcqRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
});

const COLS = [
    "mcq_id", "status", "created_at", "updated_at", "stem_text", "stem_image_key", "stem_video_url",
    "option_a_text", "option_a_image_key", "option_b_text", "option_b_image_key",
    "option_c_text", "option_c_image_key", "option_d_text", "option_d_image_key",
    "correct_option", "explanation_text", "explanation_image_key", "key_learning_point",
    "author", "commit_hash", "published_batch", "is_latest"
];

adminMcqRouter.post(
    "/mcq",
    upload.fields([
        { name: "stem_image", maxCount: 1 },
        { name: "option_a_image", maxCount: 1 },
        { name: "option_b_image", maxCount: 1 },
        { name: "option_c_image", maxCount: 1 },
        { name: "option_d_image", maxCount: 1 },
        { name: "explanation_image", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const schema = z.object({
                // ✅ Do NOT accept mcq_id from editor anymore
                // mcq_id: z.string().optional(),

                // Allow draft/ready creation; publishing is via /publish
                status: z.enum(["draft", "ready"]).default("draft"),


                stem_text: z.string().min(1),
                stem_video_url: z.string().url().optional().or(z.literal("")).default(""),

                option_a_text: z.string().min(1),
                option_b_text: z.string().min(1),
                option_c_text: z.string().min(1),
                option_d_text: z.string().min(1),

                correct_option: z.enum(["A", "B", "C", "D"]),

                explanation_text: z.string().min(1),
                key_learning_point: z.string().optional().or(z.literal("")).default(""),
                author: z.string().min(1),
            });

            const parsed = schema.parse({
                ...req.body,
                correct_option: (req.body.correct_option || "").toUpperCase(),
                stem_video_url: req.body.stem_video_url || "",
            });

            // ✅ Allocate incremental ID from Neon (source of truth)
            const { mcq_id: mcqId } = await allocateMcqId();

            const files = req.files || {};
            const getBuf = (name) => files[name]?.[0]?.buffer;

            const stem_image_key = getBuf("stem_image")
                ? (await uploadImageAsWebp({ mcqId, role: "stem", fileBuffer: getBuf("stem_image"), quality: 88 })).key
                : "";

            const option_a_image_key = getBuf("option_a_image")
                ? (await uploadImageAsWebp({ mcqId, role: "opt_a", fileBuffer: getBuf("option_a_image"), quality: 88 })).key
                : "";

            const option_b_image_key = getBuf("option_b_image")
                ? (await uploadImageAsWebp({ mcqId, role: "opt_b", fileBuffer: getBuf("option_b_image"), quality: 88 })).key
                : "";

            const option_c_image_key = getBuf("option_c_image")
                ? (await uploadImageAsWebp({ mcqId, role: "opt_c", fileBuffer: getBuf("option_c_image"), quality: 88 })).key
                : "";

            const option_d_image_key = getBuf("option_d_image")
                ? (await uploadImageAsWebp({ mcqId, role: "opt_d", fileBuffer: getBuf("option_d_image"), quality: 88 })).key
                : "";

            const explanation_image_key = getBuf("explanation_image")
                ? (await uploadImageAsWebp({ mcqId, role: "explain", fileBuffer: getBuf("explanation_image"), quality: 90 })).key
                : "";

            const nowIso = new Date().toISOString();

            const row = [
                mcqId,
                parsed.status,           // draft/ready only here
                nowIso,
                nowIso,
                parsed.stem_text,
                stem_image_key,
                parsed.stem_video_url || "",
                parsed.option_a_text,
                option_a_image_key,
                parsed.option_b_text,
                option_b_image_key,
                parsed.option_c_text,
                option_c_image_key,
                parsed.option_d_text,
                option_d_image_key,
                parsed.correct_option,
                parsed.explanation_text,
                explanation_image_key,
                parsed.key_learning_point || "",
                parsed.author,
                "",      // commit_hash (set on /publish)
                "",      // published_batch (set on /publish)
                true     // is_latest (Option 1 = one row per MCQ)
            ];

            if (row.length !== COLS.length) throw new Error("Schema row length mismatch");

            await appendMcqRow(row);

            res.json({
                ok: true,
                mcq_id: mcqId,
                image_keys: {
                    stem_image_key,
                    option_a_image_key,
                    option_b_image_key,
                    option_c_image_key,
                    option_d_image_key,
                    explanation_image_key,
                },
            });
        } catch (e) {
            res.status(400).json({ ok: false, error: e?.message || String(e) });
        }
    }
);
