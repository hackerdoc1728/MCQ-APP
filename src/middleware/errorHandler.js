import multer from "multer";

/**
 * Centralized error handler
 * - Handles Multer errors (file size, invalid files)
 * - Handles custom thrown errors
 * - Prevents HTML error responses
 */
export function errorHandler(err, req, res, next) {
    // Multer-specific errors
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                ok: false,
                error: "File too large. Maximum allowed size is 20 MB per image.",
            });
        }

        return res.status(400).json({
            ok: false,
            error: `Upload error: ${err.message}`,
        });
    }

    // Custom validation / fileFilter errors
    if (typeof err?.message === "string") {
        return res.status(400).json({
            ok: false,
            error: err.message,
        });
    }

    // Fallback (unexpected errors)
    console.error("Unhandled error:", err);

    return res.status(500).json({
        ok: false,
        error: "Internal server error",
    });
}
