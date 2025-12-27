// src/middleware/csrf.js
/* eslint-disable */
import { nanoid } from 'nanoid';
import { logger } from '../infra/logger.js';

export function generateCsrfToken(req, res, next) {
    const csrfToken = req.cookies.csrfToken;

    if (!csrfToken) {
        const newCsrfToken = nanoid(32);
        res.cookie('csrfToken', newCsrfToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 3600000,
            path: '/',
        });
        req.csrfToken = newCsrfToken;
    } else {
        req.csrfToken = csrfToken;
    }
    next();
}

export function validateCsrfToken(req, res, next) {
    if (req.method !== 'GET') {
        const csrfTokenFromCookie = req.cookies.csrfToken;
        const csrfTokenFromBody = req.body.csrfToken || req.headers['x-csrf-token'];

        if (csrfTokenFromCookie !== csrfTokenFromBody) {
            logger.warn('CSRF token validation failed');
            return res.status(403).send('CSRF token validation failed');
        }
    }
    next();
}
