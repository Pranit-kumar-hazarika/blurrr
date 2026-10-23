const { adminSupabase } = require("../config/supabase");
const { hashGuestToken } = require("../utils/crypto");
const { HttpError } = require("../utils/httpError");

async function requireGuestEvent(req, res, next) {
  try {
    const token = req.params.token;
    if (!token || token.length > 200) throw new HttpError(404, "This guest link is invalid or unavailable.", "INVALID_GUEST_LINK");

    const tokenHash = hashGuestToken(token);
    const { data: event, error } = await adminSupabase
      .from("events")
      .select("id,name,status,created_at")
      .eq("guest_token_hash", tokenHash)
      .maybeSingle();

    if (error || !event || event.status !== "active") {
      throw new HttpError(404, "This guest link is invalid or unavailable.", "INVALID_GUEST_LINK");
    }
    req.guestEvent = event;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireGuestEvent };
