const PriorityQueue = require("../utils/priorityQueue");
const Log = require("../../logging_middleware/logger");

function calculate_notification_priority(notification) {
  let typeWeight = 1;
  if (notification.Type === "Placement") typeWeight = 3;
  else if (notification.Type === "Result") typeWeight = 2;

  const timestamp = new Date(notification.Timestamp).getTime();
  const ageMs = Math.max(0, Date.now() - timestamp);
  const recencyScore = 1 / (1 + ageMs / (1000 * 60 * 60));

  return typeWeight * 100 + recencyScore;
}

async function fetch_top_notifications(notifications, topCount = 10) {
  try {
    await Log("backend", "info", "service", "Priority notification calculation started");

    const queue = new PriorityQueue();
    for (const notification of notifications) {
      queue.push({
        ...notification,
        priority: -calculate_notification_priority(notification)
      });
    }

    const selected = [];
    for (let i = 0; i < topCount && queue.size(); i++) {
      selected.push(queue.pop());
    }

    await Log("backend", "info", "service", "Top priority notifications ready");
    return selected;
  } catch (error) {
    await Log("backend", "error", "service", `Priority calculation failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  fetch_top_notifications,
  calculate_notification_priority
};
