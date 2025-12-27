import cors from "cors";
import { logger } from "../infra/logger.js";
import config from "../../config/config.js";

export function publicCors() {
    const allowedOrigins = config.publicAllowedOrigins;

    return cors({
        origin(origin, cb) {
            // no-origin requests allowed (curl/postman, server-to-server)
            if (!origin) return cb(null, true);

            if (allowedOrigins.includes(origin)) return cb(null, true);

            logger.warn(`Blocked CORS origin (public): ${origin}`);
            return cb(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true, // because admin.js uses credentials: "include"
    });
}

export function adminCors() {
    const allowedOrigins = config.adminAllowedOrigins;
    const allowNoOriginAdmin = config.allowAdminNoOrigin;

    return cors({
        origin(origin, cb) {
            if (!origin) return cb(null, allowNoOriginAdmin);
            if (allowedOrigins.includes(origin)) return cb(null, true);

            logger.warn(`Blocked CORS origin (admin): ${origin}`);
            return cb(new Error("Not allowed by CORS"));
        },
        methods: ["POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    });
}
