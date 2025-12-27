// src/middleware/clientIp.js
/* eslint-disable */
export function setupClientIp(app) {
  app.use((req, res, next) => {
    req.clientIp =
      req.headers['cf-connecting-ip'] ||
      (req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(',')[0]
        : null) ||
      req.ip;

    req.clientCountry = req.headers['cf-ipcountry'];
    next();
  });
}
