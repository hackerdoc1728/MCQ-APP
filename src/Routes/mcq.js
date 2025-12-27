// src/routes/mcq.js
/* eslint-disable */
import express from 'express';
import { getMcqPage } from '../services/mcqLoader.js';

export function registerMcqRoutes(app) {
    const router = express.Router();

    // GET /api/mcq?page=1&limit=1
    router.get('/', async (req, res, next) => {
        try {
            const { page = '1', limit = '1' } = req.query;
            const result = await getMcqPage(page, limit);
            res.json(result);
        } catch (err) {
            next(err);
        }
    });

    app.use('/api/mcq', router);
}
