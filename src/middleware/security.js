// src/middleware/security.js
/* eslint-disable */
import helmet from 'helmet';
import { nanoid } from 'nanoid';

export function nonceMiddleware(req, res, next) {
    res.locals.scriptNonce = nanoid(21);
    res.locals.styleNonce = nanoid(21);
    next();
}

export function setupSecurity(app) {
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    manifestSrc: [
      "'self'",
      'https://cdn.benchtobedsideneuro.com',
    ],
                    scriptSrc: [
                        "'self'",
                        'https://cdn.benchtobedsideneuro.com',
                        'https://www.youtube-nocookie.com',
                        'https://www.youtube.com',
                        'https://code.jquery.com',
                        'https://*.cloudflare.com',
                        'https://cdnjs.cloudflare.com',
                        'https://unpkg.com',
                        'https://code.iconify.design',
                        'https://cdn.jsdelivr.net',
                        'https://cdn.skypack.dev',
                        'https://static.cloudflareinsights.com',
                        (req, res) => `'nonce-${res.locals.scriptNonce}'`,
                    ],
                    styleSrc: [
                        "'self'",
                        'https://cdn.benchtobedsideneuro.com',
                        'https://unpkg.com',
                        'https://fonts.googleapis.com',
                        'https://cdnjs.cloudflare.com',
                        'https://fonts.gstatic.com',
                        'https://cdn.jsdelivr.net',
                        (req, res) => `'nonce-${res.locals.styleNonce}'`,
                    ],
                    imgSrc: [
                        "'self'",
                        'data:',
                        'https://cdn.benchtobedsideneuro.com',
                        'https://i.ytimg.com',
                        'https://yt3.ggpht.com',
                        'https://www.youtube.com',
                        'https://csimg.nyc3.cdn.digitaloceanspaces.com',
                        'https://img.youtube.com',
                    ],
                    connectSrc: [
                        "'self'",
                        'https://benchtobedsideneuro.com',
                        'https://cdn.benchtobedsideneuro.com',
                        'https://www.googleapis.com',
                        'https://unpkg.com',
                        'https://api.iconify.design',
                        'https://api.unisvg.com',
                        'https://cdn.jsdelivr.net',
                        'https://cloudflareinsights.com',
                    ],
                    frameSrc: [
                        "'self'",
                        'https://www.youtube.com',
                        'https://cdn.benchtobedsideneuro.com',
                        'https://www.youtube-nocookie.com',
                        'https://www.google.com/',
                    ],
                    fontSrc: [
                        "'self'",
                        'https://unpkg.com',
                        'https://cdnjs.cloudflare.com',
                        'https://cdn.benchtobedsideneuro.com',
                        'https://cdn.jsdelivr.net',
                        'https://fonts.googleapis.com',
                        'https://fonts.gstatic.com',
                    ],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                    reportUri: '/csp-violation-report-endpoint',
                },
            },
            hsts: {
                maxAge: 63072000,
                includeSubDomains: true,
                preload: true,
            },
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            noSniff: true,
            frameguard: { action: 'deny' },
            xssFilter: true,
            hidePoweredBy: true,
        })
    );

    // CSP violation endpoint
    app.post('/csp-violation-report-endpoint', (req, res) => {
        // body is already json-parsed in app.js (express.json)
        if (req.body && req.body['csp-report']) {
            console.warn(`CSP Violation: ${JSON.stringify(req.body['csp-report'])}`);
        } else {
            console.warn('CSP Violation: Invalid report format');
        }
        res.status(204).end();
    });
}
