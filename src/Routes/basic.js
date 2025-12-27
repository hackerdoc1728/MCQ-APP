// src/routes/basic.js
/* eslint-disable */
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../infra/logger.js';
import { generateCsrfToken } from '../middleware/csrf.js';

export function registerBasicPages(app, publicDir) {
    app.get('/', generateCsrfToken, async (req, res) => {
        try {
            res.render('index', { csrfToken: req.csrfToken });
        } catch (err) {
            logger.error('index.ejs not found');
            res.status(404).send('Index page not found');
        }
    });

    app.get('/about', generateCsrfToken, async (req, res) => {
        try {
            logger.info('Serving about.ejs');
            res.render('about', { csrfToken: req.csrfToken });
        } catch (err) {
            logger.error('about.ejs not found');
            res.status(404).send('About page not found');
        }
    });

    // Legacy redirects
    app.get('/about.html', (req, res) => res.redirect(301, '/about'));
}
