// src/infra/auth.js
/* eslint-disable */
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import config from '../../config/config.js';
import { logger } from './logger.js';

const { googleClientId, jwtSecret, nodeEnv } = config;

if (!googleClientId) {
    // eslint-disable-next-line no-console
    console.error('Missing GOOGLE_CLIENT_ID in environment');
}
if (!jwtSecret) {
    // eslint-disable-next-line no-console
    console.error('Missing JWT_SECRET in environment');
}

export const googleClient = new OAuth2Client(googleClientId);

export async function verifyGoogleIdToken(idToken) {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
    });
    return ticket.getPayload(); // { sub, email, name, picture, ... }
}

export function signSessionToken(user) {
    const payload = {
        uid: user.id,
        email: user.email,
    };
    return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export function verifySessionToken(token) {
    try {
        return jwt.verify(token, jwtSecret);
    } catch (err) {
        logger.debug(`Invalid session token: ${err.message}`);
        return null;
    }
}

export const sessionCookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
