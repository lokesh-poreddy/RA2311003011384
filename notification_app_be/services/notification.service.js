const { api_fetch } = require("./apiClient");
const { NOTIFICATION_API } = require("../config/constants");
const Log = require("../../logging_middleware/logger");

const notificationCache = {
  items: [],
  updatedAt: 0
};
const localNotifications = [];
const CACHE_TTL = 30000;

function normalize_notifications(rawNotifications) {
  return (rawNotifications || []).map((item) => ({
    ID: item.ID,
    Type: item.Type,
    Message: item.Message,
    Timestamp: item.Timestamp,
    isRead: Boolean(item.isRead)
  }));
}

function merge_notifications() {
  return [...localNotifications, ...notificationCache.items];
}

async function fetch_remote_notifications() {
  await Log("backend", "info", "service", "Fetching notifications from remote API");
  const payload = await api_fetch(NOTIFICATION_API, { method: "GET" });
  const items = normalize_notifications(payload.notifications || []);
  await Log("backend", "info", "service", "Remote notifications fetched successfully");
  return items;
}

async function get_notifications({ forceRefresh = false } = {}) {
  if (!forceRefresh && Date.now() - notificationCache.updatedAt < CACHE_TTL) {
    await Log("backend", "debug", "service", "Serving notifications from cache");
    return merge_notifications();
  }

  const items = await fetch_remote_notifications();
  notificationCache.items = items;
  notificationCache.updatedAt = Date.now();
  return merge_notifications();
}

async function add_notification(notificationInput) {
  const notification = {
    ID: `local-${Date.now()}`,
    Type: notificationInput.Type || "Event",
    Message: notificationInput.Message || "No message provided",
    Timestamp: new Date().toISOString(),
    isRead: false
  };

  localNotifications.unshift(notification);
  await Log("backend", "info", "service", `New notification added locally ${notification.ID}`);
  return notification;
}

async function mark_notification_read(notificationId) {
  const allItems = merge_notifications();
  const remoteIndex = notificationCache.items.findIndex((item) => item.ID === notificationId);
  const localIndex = localNotifications.findIndex((item) => item.ID === notificationId);

  if (localIndex !== -1) {
    localNotifications[localIndex].isRead = true;
    await Log("backend", "info", "service", `Notification marked as read ${notificationId}`);
    return localNotifications[localIndex];
  }

  if (remoteIndex !== -1) {
    notificationCache.items[remoteIndex].isRead = true;
    await Log("backend", "info", "service", `Notification marked as read ${notificationId}`);
    return notificationCache.items[remoteIndex];
  }

  throw new Error(`Notification not found: ${notificationId}`);
}

module.exports = {
  get_notifications,
  add_notification,
  mark_notification_read
};
