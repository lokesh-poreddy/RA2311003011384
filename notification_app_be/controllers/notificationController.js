const {
  get_notifications,
  add_notification,
  mark_notification_read
} = require("../services/notification.service");
const { fetch_top_notifications } = require("../services/priorityNotificationService");
const { process_bulk_notifications } = require("../services/bulkNotificationProcessor");
const Log = require("../../logging_middleware/logger");

async function getAllNotifications(req, res) {
  try {
    const data = await get_notifications();
    await Log("backend", "info", "controller", "Fetched all notifications");
    res.json({ status: "success", count: data.length, data });
  } catch (err) {
    await Log("backend", "error", "controller", err.message);
    res.status(500).json({ status: "error", message: "Failed to fetch notifications" });
  }
}

async function createNotification(req, res) {
  try {
    const newNotification = await add_notification(req.body);
    await Log("backend", "info", "controller", `Created notification ${newNotification.ID}`);
    res.status(201).json({ status: "success", data: newNotification });
  } catch (err) {
    await Log("backend", "error", "controller", err.message);
    res.status(400).json({ status: "error", message: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const updated = await mark_notification_read(req.params.id);
    await Log("backend", "info", "controller", `Marked notification read ${req.params.id}`);
    res.json({ status: "success", data: updated });
  } catch (err) {
    await Log("backend", "warn", "controller", err.message);
    res.status(404).json({ status: "error", message: err.message });
  }
}

async function getPriorityNotifications(req, res) {
  try {
    const data = await get_notifications();
    const topCount = Number(req.query.limit || 10);
    const result = await fetch_top_notifications(data, topCount);
    await Log("backend", "info", "controller", "Priority notifications provided");
    res.json({ status: "success", count: result.length, data: result });
  } catch (err) {
    await Log("backend", "error", "controller", err.message);
    res.status(500).json({ status: "error", message: "Priority notifications failed" });
  }
}

async function postBulkNotifications(req, res) {
  try {
    const summary = await process_bulk_notifications(req.body.notifications);
    await Log("backend", "info", "controller", "Bulk notifications processed");
    res.json({ status: "success", summary });
  } catch (err) {
    await Log("backend", "error", "controller", err.message);
    res.status(400).json({ status: "error", message: err.message });
  }
}

module.exports = {
  getAllNotifications,
  createNotification,
  markAsRead,
  getPriorityNotifications,
  postBulkNotifications
};
