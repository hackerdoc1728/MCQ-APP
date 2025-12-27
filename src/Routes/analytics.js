// src/routes/analytics.js
/* eslint-disable */
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
    getUserSummary,
    getUserTopicStats,
    getUserDailyTimeline,
} from '../services/analyticsService.js';

export function registerAnalyticsRoutes(app) {
    const router = express.Router();

    // GET /api/analytics/summary
    router.get('/summary', requireAuth, async (req, res, next) => {
        try {
            const data = await getUserSummary(req.user.id);
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    // GET /api/analytics/topics
    router.get('/topics', requireAuth, async (req, res, next) => {
        try {
            const data = await getUserTopicStats(req.user.id);
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    // GET /api/analytics/timeline?days=30
    router.get('/timeline', requireAuth, async (req, res, next) => {
        try {
            const days = parseInt(req.query.days || '30', 10);
            const data = await getUserDailyTimeline(req.user.id, days);
            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    app.use('/api/analytics', router);
}
