const { randomUUID } = require("node:crypto");
const { Readable } = require("node:stream");
const { adminSupabase } = require("../config/supabase");
const env = require("../config/env");
const { HttpError } = require("../utils/httpError");

function safeExtension(mime) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[mime] || "bin";
}

async function uploadPhoto(eventId, file) {
  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(file.buffer);
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!detected || !allowed.has(detected.mime)) {
    throw new HttpError(415, "The uploaded file is not a supported image.", "INVALID_IMAGE_CONTENT");
  }

  const storagePath = `${eventId}/${randomUUID()}.${safeExtension(detected.mime)}`;
  const { error } = await adminSupabase.storage.from(env.storageBucket).upload(storagePath, file.buffer, {
    contentType: detected.mime,
    upsert: false
  });
  if (error) throw new HttpError(502, "The image could not be stored. Please try again.", "STORAGE_UPLOAD_FAILED");
  return { storagePath, mimeType: detected.mime };
}

async function createSignedUrl(storagePath, expiresIn = 300, downloadName) {
  const options = downloadName ? { download: downloadName } : {};
  const { data, error } = await adminSupabase.storage.from(env.storageBucket)
    .createSignedUrl(storagePath, expiresIn, options);
  if (error || !data?.signedUrl) throw new HttpError(502, "Could not prepare a private image link.", "SIGNED_URL_FAILED");
  return data.signedUrl;
}

async function removeStorageObjects(paths) {
  if (!paths.length) return;
  const { error } = await adminSupabase.storage.from(env.storageBucket).remove(paths);
  if (error) throw new HttpError(502, "Storage cleanup failed. Please retry the operation.", "STORAGE_DELETE_FAILED");
}

async function getStorageStream(storagePath) {
  const url = await createSignedUrl(storagePath, 120);
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new HttpError(502, "A photo could not be retrieved for the archive.", "ARCHIVE_SOURCE_FAILED");
  return Readable.fromWeb(response.body);
}

module.exports = { uploadPhoto, createSignedUrl, removeStorageObjects, getStorageStream };
