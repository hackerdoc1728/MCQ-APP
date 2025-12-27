// src/routes/adminConfig.js
import express from "express";
const router = express.Router();

router.get("/admin/config.js", (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && req.hostname !== "admin.benchtobedsideneuro.com") {
        return res.status(404).send("Not found");
    }

    const apiBase =
        process.env.ADMIN_API_BASE ||
        (isProd ? "https://benchtobedsideneuro.com" : "http://localhost:3000");

    res.type("application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(
        `window.__ADMIN_CONFIG__ = Object.freeze({ apiBase: ${JSON.stringify(apiBase)} });`
    );
});

export default router;
