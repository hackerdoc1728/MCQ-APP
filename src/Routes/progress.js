// src/routes/progress.js
/* eslint-disable */
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getUserProgress, saveMcqAnswer } from '../services/progressService.js';

export function registerProgressRoutes(app) {
    const router = express.Router();

    // GET /api/progress
    router.get('/', requireAuth, async (req, res, next) => {
        try {
            const data = await getUserProgress(req.user.id);
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    // POST /api/progress
    // body: { mcqId, answer, isCorrect, currentPage }
    router.post('/', requireAuth, async (req, res, next) => {
        try {
            const { mcqId, answer, isCorrect, currentPage } = req.body;

            if (!mcqId) {
                return res.status(400).json({ error: 'mcqId required' });
            }

            await saveMcqAnswer({
                userId: req.user.id,
                mcqId,
                answer: answer ?? null,
                isCorrect: typeof isCorrect === 'boolean' ? isCorrect : null,
                currentPage: currentPage ?? null,
            });

            res.json({ ok: true });
        } catch (err) {
            next(err);
        }
    });

    app.use('/api/progress', router);
}
