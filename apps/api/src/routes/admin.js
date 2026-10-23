const express = require("express");
const controller = require("../controllers/eventsController");
const { requireOrganizer } = require("../middleware/auth");

const router = express.Router();
router.use(requireOrganizer);
router.get("/events", controller.adminListEvents);
router.get("/events/:id/photos", controller.adminListPhotos);
router.get("/events/:id/download", controller.adminDownloadZip);
router.delete("/events/:id", controller.adminDeleteEvent);
router.delete("/photos/:id", controller.adminDeletePhoto);

module.exports = router;
