
const Log = require("../logging_middleware/logger");

/**
 * Select optimal set of vehicles/tasks
 * @param {Array} tasks - [{ id, time, score }]
 * @param {number} maxHours - total available mechanic hours
 * @returns {Object} selected tasks + total score
 */
async function scheduleVehicles(tasks, maxHours) {
  try {
    await Log("backend", "info", "service", "Starting vehicle scheduling");

    const n = tasks.length;

    // DP table
    const dp = Array.from({ length: n + 1 }, () =>
      Array(maxHours + 1).fill(0)
    );

    // Build DP table
    for (let i = 1; i <= n; i++) {
      const { time, score } = tasks[i - 1];

      for (let w = 0; w <= maxHours; w++) {
        if (time <= w) {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            score + dp[i - 1][w - time]
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    // Backtrack to find selected tasks
    let w = maxHours;
    const selectedTasks = [];

    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selectedTasks.push(tasks[i - 1]);
        w -= tasks[i - 1].time;
      }
    }

    const result = {
      totalScore: dp[n][maxHours],
      selectedTasks: selectedTasks.reverse()
    };

    await Log("backend", "info", "service", "Scheduling completed successfully");

    return result;

  } catch (error) {
    await Log("backend", "error", "service", error.message);
    throw error;
  }
}

module.exports = scheduleVehicles;