// src/routes/adminform.js
/* eslint-disable */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_DIR = path.join(__dirname, "..", "..", "public", "admin");
const ADMIN_INDEX = path.join(ADMIN_DIR, "admin.html");

// MUST be the real admin host you want
const ADMIN_HOST = (process.env.ADMIN_HOST || "admin.benchtobedsideneuro.com").toLowerCase();

function isAdminHost(req) {
    const host = (req.hostname || "").toLowerCase();
    return host === ADMIN_HOST;
}

/**
 * CRITICAL:
 * If not admin host → skip this router completely
 */
router.use((req, res, next) => {
    if (!isAdminHost(req)) return next("router"); // ✅ exit router, let main site handle it
    return next();
});

// Admin static assets (admin host only because of guard above)
router.use(express.static(ADMIN_DIR, { index: false }));

// https://admin.../ -> admin.html
router.get("/", (req, res) => res.sendFile(ADMIN_INDEX));

// Optional convenience
router.get("/admin", (req, res) => res.redirect("/"));
router.get("/admin/admin.html", (req, res) => res.sendFile(ADMIN_INDEX));

export function registerAdminFormRoutes(app) {
    app.use("/", router);
}
