import crypto from "crypto";
import sharp from "sharp";
import { putObject } from "./r2.js";

export async function uploadImageAsWebp({ mcqId, role, fileBuffer, quality = 88 }) {
    try {
        //  Verify it's actually an image Sharp can decode
        await sharp(fileBuffer, { failOnError: true }).metadata();

        // Convert to webp
        const webpBuffer = await sharp(fileBuffer)
            .rotate()
            .webp({ quality })
            .toBuffer();

        const hash = crypto.createHash("sha256").update(webpBuffer).digest("hex").slice(0, 10);
        const key = `mcq_test/${mcqId}/${role}_${hash}.webp`; // keep mcq_test during testing

        return putObject({ key, body: webpBuffer, contentType: "image/webp" });
    } catch {
        throw new Error(
            "Uploaded file is not a valid PNG/JPG/WEBP image (file content invalid)."
        );
    }

}
