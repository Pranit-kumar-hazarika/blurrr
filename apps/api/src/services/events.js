const { adminSupabase } = require("../config/supabase");
const { HttpError } = require("../utils/httpError");
const { removeStorageObjects } = require("./storage");

async function assertOwner(eventId, userId) {
  const { data, error } = await adminSupabase.from("events")
    .select("id,name,status,guest_token_hash,created_at,admin_user_id")
    .eq("id", eventId).eq("admin_user_id", userId).maybeSingle();
  if (error || !data) throw new HttpError(404, "Event not found.", "EVENT_NOT_FOUND");
  return data;
}

async function listPhotos(eventId) {
  const { data, error } = await adminSupabase.from("photos")
    .select("id,event_id,storage_path,original_filename,created_at")
    .eq("event_id", eventId).order("created_at", { ascending: false });
  if (error) throw new HttpError(502, "Could not load event photos.", "PHOTO_LIST_FAILED");
  return data || [];
}

async function deleteEventSafely(eventId, userId) {
  const event = await assertOwner(eventId, userId);

  // Block new guest requests immediately. Keep the row so cleanup can be retried.
  const { error: markError } = await adminSupabase.from("events")
    .update({ status: "pending_deletion" })
    .eq("id", eventId).eq("admin_user_id", userId);
  if (markError) throw new HttpError(502, "Could not begin event deletion.", "DELETE_START_FAILED");

  const photos = await listPhotos(eventId);
  const paths = photos.map((photo) => photo.storage_path);

  // If storage cleanup fails, keep the event and photo rows for a retry.
  await removeStorageObjects(paths);

  const { error: photoError } = await adminSupabase.from("photos").delete().eq("event_id", eventId);
  if (photoError) throw new HttpError(502, "Images were cleaned up, but database cleanup needs a retry.", "DELETE_DB_RETRY_REQUIRED");

  const { error: eventError } = await adminSupabase.from("events")
    .delete().eq("id", eventId).eq("admin_user_id", userId);
  if (eventError) throw new HttpError(502, "Event cleanup needs a retry.", "DELETE_DB_RETRY_REQUIRED");
  return { deleted: true };
}

module.exports = { assertOwner, listPhotos, deleteEventSafely };
