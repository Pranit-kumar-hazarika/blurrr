const multer = require("multer");
const env = require("../config/env");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter(req, file, cb) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.mimetype)) {
      return cb(Object.assign(new Error("Only JPEG, PNG, and WebP images are allowed."), { status: 415, code: "UNSUPPORTED_IMAGE" }));
    }
    cb(null, true);
  }
});

module.exports = { upload };
