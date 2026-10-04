import { v2 as cloudinary } from "cloudinary";

let configured = false;

function setup() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  return true;
}

export function isCloudinaryConfigured() {
  if (configured) return true;
  configured = setup();
  return configured;
}

// Stores the image remotely, returns the delivery URL persisted in issues.photo_key.
export async function uploadPhoto(buffer, contentType) {
  if (!isCloudinaryConfigured()) {
    throw new Error("[cloudinary] Missing env CLOUDINARY_CLOUD_NAME/_API_KEY/_API_SECRET — see .env.example.");
  }
  const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder: "campusfix/issues" });
  return result.secure_url;
}

// photo_key already holds the delivery URL; legacy non-URL values resolve to null.
export async function getPhotoUrl(ref) {
  if (!ref) return null;
  if (/^https?:\/\//.test(ref)) return ref;
  return null;
}
