const { randomUUID } = require("node:crypto");
const { z } = require("zod");
const { adminSupabase } = require("../config/supabase");
const { createGuestToken, hashGuestToken } = require("../utils/crypto");
const { HttpError } = require("../utils/httpError");
const { assertOwner, listPhotos, deleteEventSafely } = require("../services/events");
const { uploadPhoto, createSignedUrl, removeStorageObjects, getStorageStream } = require("../services/storage");
const archiver = require("archiver");

const createSchema = z.object({
  name: z.string().trim().min(2).max(100)
});

function safeFilename(name, fallback) {
  const base = String(name || fallback).normalize("NFKC")
    .replace(/[\/\\?%*:|"<>]/g, "_").replace(/[\x00-\x1f\x7f]/g, "")
    .trim().slice(0, 100);
  return base || fallback;
}

async function createEvent(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Enter an event name between 2 and 100 characters.", "INVALID_EVENT_NAME");
    const token = createGuestToken();
    const { data, error } = await adminSupabase.from("events").insert({
      id: randomUUID(),
      name: parsed.data.name,
      guest_token_hash: hashGuestToken(token),
      admin_user_id: req.user.id,
      status: "active"
    }).select("id,name,status,created_at").single();

    if (error || !data) throw new HttpError(502, "Could not create the event.", "EVENT_CREATE_FAILED");
    res.status(201).json({ event: data, guestToken: token });
  } catch (error) { next(error); }
}

async function getGuestEvent(req, res) {
  res.json({ event: { id: req.guestEvent.id, name: req.guestEvent.name, created_at: req.guestEvent.created_at } });
}

async function guestListPhotos(req, res, next) {
  try {
    const photos = await listPhotos(req.guestEvent.id);
    const result = await Promise.all(photos.map(async (photo) => ({
      id: photo.id,
      original_filename: photo.original_filename,
      created_at: photo.created_at,
      url: await createSignedUrl(photo.storage_path, 300)
    })));
    res.json({ photos: result });
  } catch (error) { next(error); }
}

async function guestUploadPhoto(req, res, next) {
  let storedPath;
  try {
    if (!req.file) throw new HttpError(400, "Choose an image to upload.", "IMAGE_REQUIRED");
    const stored = await uploadPhoto(req.guestEvent.id, req.file);
    storedPath = stored.storagePath;
    const originalFilename = safeFilename(req.file.originalname, `blurrr-${Date.now()}.jpg`);
    const { data, error } = await adminSupabase.from("photos").insert({
      id: randomUUID(),
      event_id: req.guestEvent.id,
      storage_path: stored.storagePath,
      original_filename: originalFilename
    }).select("id,event_id,original_filename,created_at").single();

    if (error || !data) throw new HttpError(502, "Could not save photo metadata.", "PHOTO_RECORD_FAILED");
    res.status(201).json({ photo: data });
  } catch (error) {
    if (storedPath) {
      try { await removeStorageObjects([storedPath]); } catch (_) { /* orphan cleanup should be retried operationally */ }
    }
    next(error);
  }
}

async function adminListEvents(req, res, next) {
  try {
    const { data, error } = await adminSupabase.from("events")
      .select("id,name,status,created_at")
      .eq("admin_user_id", req.user.id).order("created_at", { ascending: false });
    if (error) throw new HttpError(502, "Could not load your events.", "EVENT_LIST_FAILED");

    const events = await Promise.all((data || []).map(async (event) => {
      const { count, error: countError } = await adminSupabase.from("photos")
        .select("id", { count: "exact", head: true }).eq("event_id", event.id);
      return { ...event, photo_count: countError ? null : count };
    }));
    res.json({ events });
  } catch (error) { next(error); }
}

async function adminListPhotos(req, res, next) {
  try {
    await assertOwner(req.params.id, req.user.id);
    const photos = await listPhotos(req.params.id);
    const result = await Promise.all(photos.map(async (photo) => ({
      id: photo.id,
      original_filename: photo.original_filename,
      created_at: photo.created_at,
      url: await createSignedUrl(photo.storage_path, 300)
    })));
    res.json({ photos: result });
  } catch (error) { next(error); }
}

async function adminDeletePhoto(req, res, next) {
  try {
    const { id } = req.params;
    const { data: photo, error } = await adminSupabase.from("photos")
      .select("id,event_id,storage_path").eq("id", id).maybeSingle();
    if (error || !photo) throw new HttpError(404, "Photo not found.", "PHOTO_NOT_FOUND");
    await assertOwner(photo.event_id, req.user.id);
    await removeStorageObjects([photo.storage_path]);
    const { error: dbError } = await adminSupabase.from("photos").delete().eq("id", id);
    if (dbError) throw new HttpError(502, "Image removed but metadata cleanup failed; contact the administrator.", "PHOTO_DB_DELETE_FAILED");
    res.json({ deleted: true });
  } catch (error) { next(error); }
}

async function adminDownloadZip(req, res, next) {
  try {
    const event = await assertOwner(req.params.id, req.user.id);
    if (event.status !== "active") throw new HttpError(409, "This event is already being deleted.", "EVENT_NOT_ACTIVE");
    const photos = await listPhotos(event.id);
    const archiveName = `${safeFilename(event.name, "blurrr-event")}-photos.zip`.replace(/\.zip$/i, "") + ".zip";

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${archiveName.replace(/["\r\n]/g, "_")}"`);
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("warning", (err) => { if (err.code !== "ENOENT") archive.destroy(err); });
    archive.on("error", (err) => {
      if (!res.headersSent) next(err);
      else res.destroy(err);
    });
    archive.pipe(res);

    for (const photo of photos) {
      const stream = await getStorageStream(photo.storage_path);
      const fileName = safeFilename(photo.original_filename, `${photo.id}.jpg`);
      archive.append(stream, { name: `${photo.id}-${fileName}` });
    }
    await archive.finalize();
  } catch (error) {
    if (!res.headersSent) next(error);
    else res.destroy(error);
  }
}

async function adminDeleteEvent(req, res, next) {
  try {
    const result = await deleteEventSafely(req.params.id, req.user.id);
    res.json(result);
  } catch (error) { next(error); }
}

module.exports = {
  createEvent, getGuestEvent, guestListPhotos, guestUploadPhoto,
  adminListEvents, adminListPhotos, adminDeletePhoto, adminDownloadZip, adminDeleteEvent
};
