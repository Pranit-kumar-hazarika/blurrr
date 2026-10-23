const express = require("express");
const controller = require("../controllers/eventsController");
const { requireOrganizer } = require("../middleware/auth");
const { requireGuestEvent } = require("../middleware/guestAccess");
const { upload } = require("../middleware/upload");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();
const guestUploadLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many uploads. Please wait before trying again.", code: "UPLOAD_RATE_LIMIT" }
});

router.post("/", requireOrganizer, controller.createEvent);
router.get("/guest/:token", requireGuestEvent, controller.getGuestEvent);
router.get("/guest/:token/photos", requireGuestEvent, controller.guestListPhotos);
router.post("/guest/:token/photos", guestUploadLimit, requireGuestEvent, upload.single("photo"), controller.guestUploadPhoto);

module.exports = router;
