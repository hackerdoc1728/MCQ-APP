# Backend Structure

This document describes the **exact backend code structure and responsibilities**.

---

## 1. Entry Point

### `server.js`
- Process lifecycle
- Cluster management (prod)
- Worker startup
- Graceful shutdown
- Cache warm hooks

---

## 2. App Composition

### `src/app.js`
Responsible for:
- Middleware registration
- Route mounting
- Infra initialization
- Central error handling

Middleware order (simplified):
1. Parsing & compression
2. Logging + client IP
3. CORS
4. Security (Helmet + CSP)
5. Rate limits
6. Auth attach
7. Static assets
8. Routes
9. Error handler

---

## 3. Directory Layout

```text
src/
├── app.js
├── infra/
│   ├── pg.js
│   ├── redis.js
│   ├── r2.js
│   ├── auth.js
│   └── logger.js
├── middleware/
│   ├── authMiddleware.js
│   ├── csrf.js
│   ├── rateLimit.js
│   ├── security.js
│   └── errorHandler.js
├── routes/
│   ├── public/
│   ├── admin/
│   └── auth.js
├── services/
│   ├── mcqLoader.js
│   ├── mcqPublish.js
│   ├── progressService.js
│   ├── analyticsService.js
│   ├── userService.js
│   └── images.js
```
