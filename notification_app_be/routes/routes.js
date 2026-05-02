const express = require("express");
const router = express.Router();

const {
  getAllNotifications,
  createNotification,
  markAsRead,
  getPriorityNotifications,
  postBulkNotifications
} = require("../controllers/notificationController");

router.get("/", getAllNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markAsRead);
router.get("/priority", getPriorityNotifications);
router.post("/bulk", postBulkNotifications);

module.exports = router;