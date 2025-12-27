import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "../../config/config.js"; // adjust import to your config pattern

const endpoint = `https://${config.r2AccountId}.r2.cloudflarestorage.com`;

export const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
});

export async function putObject({ key, body, contentType }) {
  await r2.send(
    new PutObjectCommand({
      Bucket: config.r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const cdn = config.cdnBaseUrl.replace(/\/$/, "");
  return { key, url: `${cdn}/${key}` };
}
