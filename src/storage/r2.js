import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`[r2] Missing env ${name} — see .env.example.`);
  return v;
}

let client = null;
export function r2() {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

export function isR2Configured() {
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
}

export async function uploadPhoto(buffer, contentType) {
  const bucket = required("R2_BUCKET");
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `issues/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  await r2().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }));
  return key;
}

export async function getPhotoUrl(key) {
  if (!key) return null;
  if (process.env.R2_PUBLIC_URL) return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  const bucket = required("R2_BUCKET");
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
}
