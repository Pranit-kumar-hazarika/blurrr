const { authSupabase } = require("../config/supabase");
const { HttpError } = require("../utils/httpError");

async function requireOrganizer(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new HttpError(401, "Please sign in to continue.", "AUTH_REQUIRED");

    const { data, error } = await authSupabase.auth.getUser(match[1]);
    if (error || !data?.user) {
      throw new HttpError(401, "Your session is invalid or expired. Please sign in again.", "INVALID_SESSION");
    }
    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireOrganizer };
