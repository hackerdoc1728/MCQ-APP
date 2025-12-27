// src/middleware/authMiddleware.js
/* eslint-disable */
import { verifySessionToken } from '../infra/auth.js';

export function attachUser(req, res, next) {
    const token = req.cookies?.session;
    if (!token) return next();

    const payload = verifySessionToken(token);
    if (payload) {
        req.user = { id: payload.uid, email: payload.email };
    }
    next();
}

export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    next();
}
