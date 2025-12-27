// src/app.js
/* eslint-disable */
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { initRedis } from "./infra/redis.js";
import { initMySQL } from "./infra/db.js";
import { registerStatic } from "./infra/static.js";

import { setupLogging } from "./middleware/logging.js";
import { publicCors } from "./middleware/cors.js";
import { setupSecurity, nonceMiddleware } from "./middleware/security.js";
import { setupClientIp } from "./middleware/clientIp.js";
import { setupRateLimits } from "./middleware/rateLimit.js";
import { adminHostOnly } from "./middleware/adminHostOnly.js";
import { attachUser } from "./middleware/authMiddleware.js";

import { registerBasicPages } from "./routes/basic.js";
import { registerContactRoutes } from "./routes/contact.js";
import { registerVideoRoutes } from "./routes/videos.js";
import { registerMusingsRoutes } from "./routes/musings.js";
import { registerSynapseSpeaksRoutes } from "./routes/synapseSpeaks.js";
import { registerCortexSnapshotsRoutes } from "./routes/cortexSnapshots.js";
import { registerNeuroPulseRoutes } from "./routes/neuroPulse.js";

// MCQ routes
import { registerAuthRoutes } from "./routes/auth.js";
import { publicMcqRouter } from "./routes/publicMcq.js";
import { registerProgressRoutes } from "./routes/progress.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";

// Admin routes + UI
import { adminMcqRouter } from "./routes/adminMcq.js";
import { adminPublishRouter } from "./routes/adminPublish.js";
import { adminPublishBatchRouter } from "./routes/adminPublishBatch.js";
import { registerAdminFormRoutes } from "./routes/adminform.js";

import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

// In prod, set: ASSET_BASE_URL=https://cdn.benchtobedsideneuro.com
const ASSET_BASE_URL = process.env.ASSET_BASE_URL || "";

export async function createApp() {
    const app = express();

    // Behind Cloudflare/Tunnel
    app.set("trust proxy", 1);
    app.set("view engine", "ejs");
    app.locals.assetBaseUrl = ASSET_BASE_URL;

    /* =========================
       Core middleware
       ========================= */
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(compression());

    setupLogging(app);
    setupClientIp(app);

    // CORS: apply only to APIs (admin UI is cross-origin to apex API)
    app.use("/api", publicCors());
   

    // Security + rate limits AFTER CORS so OPTIONS doesn't get blocked
    app.use(nonceMiddleware);
    setupSecurity(app);
    setupRateLimits(app);

    // Attach user from session cookie (if applicable)
    app.use(attachUser);

    /* =========================
       Static
       ========================= */
    registerStatic(app, publicDir);

    /* =========================
       Infra
       ========================= */
    await initRedis();
    await initMySQL();

    /* =========================
       Health (for admin ping)
       ========================= */
    app.get("/api/health", (req, res) => res.json({ ok: true }));

    /* =========================
       Admin UI (served only on admin host)
       ========================= */
    registerAdminFormRoutes(app);

    // Optional: keep this redirect if you still want /admin -> /admin/admin.html
    app.get("/admin", (req, res) => {
        if (
            process.env.NODE_ENV === "production" &&
            req.hostname !== "admin.benchtobedsideneuro.com"
        ) {
            return res.status(404).send("Not found");
        }
        return res.redirect("/admin/admin.html");
    });

    /* =========================
       Site routes
       ========================= */
    registerBasicPages(app, publicDir);
    registerContactRoutes(app);
    registerVideoRoutes(app);
    registerMusingsRoutes(app, publicDir);
    registerSynapseSpeaksRoutes(app, publicDir);
    registerCortexSnapshotsRoutes(app, publicDir);
    registerNeuroPulseRoutes(app, publicDir);

    /* =========================
       MCQ backend routes
       ========================= */
    registerAuthRoutes(app);

    // Keep your existing mount path (adjust admin.js accordingly)
    app.use("/api/mcq", publicMcqRouter);

    registerProgressRoutes(app);
    registerAnalyticsRoutes(app);

    /* =========================
       Admin APIs (host-locked)
       ========================= */
    app.use("/api/admin", adminHostOnly, adminMcqRouter); // create/upload
    app.use("/api/admin", adminHostOnly, adminPublishRouter); // publish one
    app.use("/api/admin", adminHostOnly, adminPublishBatchRouter); // commit/batch

    /* =========================
       Errors
       ========================= */
    app.use(errorHandler);

    return app;
}
