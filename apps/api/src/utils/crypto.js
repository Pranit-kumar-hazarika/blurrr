const crypto = require("node:crypto");

function createGuestToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashGuestToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { createGuestToken, hashGuestToken };
