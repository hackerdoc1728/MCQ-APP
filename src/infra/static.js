// src/infra/static.js
/* eslint-disable */
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { logger } from './logger.js';

export function registerStatic(app, publicDir) {
  app.use(
    '/assets',
    express.static(path.join(publicDir, 'assets'), { maxAge: '1d' })
  );

  app.use(
    '/images/mcq',
    express.static(path.join(publicDir, 'images', 'mcq'), { maxAge: '1d' })
  );

  app.use(
    '/assets',
    express.static(path.join(publicDir, 'assets'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      },
    })
  );

  app.use(
    '/blog-content',
    express.static(path.join(publicDir, 'blog', 'blog-content'))
  );

  app.use(express.static(publicDir));

  // Static videos page
  app.get('/videos', async (req, res) => {
    const filePath = path.join(publicDir, 'videos.html');
    try {
      await fs.access(filePath);
      logger.info('Serving videos.html');
      res.sendFile(filePath);
    } catch {
      logger.error('videos.html not found');
      res.status(404).send('Video page not found');
    }
  });

  app.get('/videos.html', (req, res) => res.redirect(301, '/videos'));

  // Static MCQ page (just HTML, no engine)
  app.get('/mcq', async (req, res) => {
    const filePath = path.join(publicDir, 'mcq.html');
    try {
      await fs.access(filePath);
      logger.info('Serving mcq.html');
      res.sendFile(filePath);
    } catch {
      logger.error('mcq.html not found');
      res.status(404).send('MCQ page not found');
    }
  });

  app.get('/mcq.html', (req, res) => res.redirect(301, '/mcq'));
}
