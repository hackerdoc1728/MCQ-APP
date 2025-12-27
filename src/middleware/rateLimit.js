// src/middleware/rateLimit.js
/* eslint-disable */
import rateLimit from 'express-rate-limit';
import { logger } from '../infra/logger.js';

const createLimiter = (maxRequests) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.clientIp || req.ip,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.clientIp || req.ip}`);
            res.status(429).json({
                error: 'Too many requests. Please try again later.',
            });
        },
    });

export function setupRateLimits(app) {
    const videosLimiter = createLimiter(30);
    app.use('/api/videos', videosLimiter);
}
