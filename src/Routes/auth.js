// src/routes/auth.js
/* eslint-disable */
import express from 'express';
import {
    verifyGoogleIdToken,
    signSessionToken,
    sessionCookieOptions,
} from '../infra/auth.js';
import { redisClient } from '../infra/redis.js'; // ✅ add this
import { upsertUserFromGoogle, getUserById } from '../services/userService.js';

export function registerAuthRoutes(app) {
    const router = express.Router();

    // POST /api/auth/google
    router.post('/google', async (req, res, next) => {
        let lockKey = null;

        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ error: 'Missing idToken' });
            }

            const payload = await verifyGoogleIdToken(idToken);
            if (!payload?.email || !payload?.sub) {
                return res.status(400).json({ error: 'Invalid Google token' });
            }

            // ✅ Deduplicate duplicate login requests (React StrictMode, double click, retries)
            lockKey = `lock:login:${payload.sub}`;
            const gotLock = await redisClient.set(lockKey, '1', { NX: true, EX: 5 });

            if (!gotLock) {
                // Another login request is already processing for this account
                return res.status(202).json({ ok: true, deduped: true });
            }

            const user = await upsertUserFromGoogle(payload);
            const jwt = signSessionToken(user);

            res.cookie('session', jwt, sessionCookieOptions);
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                },
            });
        } catch (err) {
            next(err);
        } finally {
            if (lockKey) {
                // Best-effort unlock
                try { await redisClient.del(lockKey); } catch (_) { }
            }
        }
    });

    // GET /api/auth/me
    router.get('/me', async (req, res, next) => {
        try {
            if (!req.user) return res.json({ loggedIn: false });

            const user = await getUserById(req.user.id);
            if (!user) return res.json({ loggedIn: false });

            res.json({ loggedIn: true, user });
        } catch (err) {
            next(err);
        }
    });

    // POST /api/auth/logout
    router.post('/logout', (req, res) => {
        res.clearCookie('session', { path: '/' });
        res.json({ ok: true });
    });

    app.use('/api/auth', router);
}
