/* global process */

function parseCsv(value) {
    return value
        ? value.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
}

function pickByEnv(devKey, prodKey) {
    const isProd = (process.env.NODE_ENV || "development") === "production";
    return isProd ? process.env[prodKey] : process.env[devKey];
}

export default {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

    neonDatabaseUrl: process.env.NEON_DATABASE_URL,

    youtubeApiKeys: parseCsv(process.env.YOUTUBE_API_KEYS),

    // ✅ Public CORS allowlist
    publicAllowedOrigins: parseCsv(
        pickByEnv("PUBLIC_CORS_ALLOWED_ORIGINS_DEV", "PUBLIC_CORS_ALLOWED_ORIGINS_PROD")
    ),

    // ✅ Admin CORS allowlist (only if you use adminCors)
    adminAllowedOrigins: parseCsv(
        pickByEnv("ADMIN_CORS_ALLOWED_ORIGINS_DEV", "ADMIN_CORS_ALLOWED_ORIGINS_PROD")
    ),

    // ✅ allow curl/postman on admin CORS only in dev
    allowAdminNoOrigin:
        (process.env.NODE_ENV || "development") !== "production" &&
        process.env.ALLOW_ADMIN_NO_ORIGIN === "true",

    mysql: {
        host: process.env.MYSQL_HOST || "localhost",
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE || "btbncontact",
    },

    // OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,

    oauthBaseUrl:
        process.env.OAUTH_BASE_URL || "https://accounts.google.com/o/oauth2/v2/auth",
    googleTokenUrl:
        process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token",

    oauthFrontendSuccessUrl: process.env.OAUTH_FRONTEND_SUCCESS_URL,
    oauthFrontendErrorUrl: process.env.OAUTH_FRONTEND_ERROR_URL,

    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET,

    // Admin + Sheets + R2 (unchanged)
    adminBearerToken: process.env.ADMIN_BEARER_TOKEN,
    adminEmails: parseCsv(process.env.ADMIN_EMAILS),

    googleSheetId: process.env.GOOGLE_SHEET_ID,
    googleSheetTab: process.env.GOOGLE_SHEET_TAB || "mcq_master",
    googleServiceAccountJsonPath: process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH,
    googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,

    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.R2_BUCKET,
    cdnBaseUrl: process.env.CDN_BASE_URL,

    assetBaseUrl: process.env.ASSET_BASE_URL || "",
};
