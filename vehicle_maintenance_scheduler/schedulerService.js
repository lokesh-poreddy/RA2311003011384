const Log = require("../logging_middleware/logger");

/**
 * Build optimal maintenance plan using 0/1 knapsack.
 * @param {Array} tasks - [{ taskId, duration, impact }]
 * @param {number} availableHours
 * @returns {Object} { selectedTasks, totalImpact, totalDuration }
 */
async function calculate_optimal_schedule(tasks, availableHours) {
  try {
    await Log("backend", "info", "service", "Starting scheduler calculation");

    if (!Array.isArray(tasks) || typeof availableHours !== "number") {
      throw new Error("Invalid scheduler input");
    }

    const normalized = tasks.map((item, index) => ({
      taskId: item.taskId || item.id || `task_${index}`,
      duration: Number(item.duration ?? item.time ?? 0),
      impact: Number(item.impact ?? item.score ?? 0)
    }));

    const n = normalized.length;
    const capacity = Math.max(0, Math.floor(availableHours));

    const dp = Array.from({ length: n + 1 }, () =>
      Array(capacity + 1).fill(0)
    );

    for (let i = 1; i <= n; i++) {
      const current = normalized[i - 1];
      for (let hours = 0; hours <= capacity; hours++) {
        if (current.duration <= hours) {
          dp[i][hours] = Math.max(
            dp[i - 1][hours],
            current.impact + dp[i - 1][hours - current.duration]
          );
        } else {
          dp[i][hours] = dp[i - 1][hours];
        }
      }
    }

    let remainingHours = capacity;
    const chosen = [];

    for (let i = n; i > 0; i--) {
      if (dp[i][remainingHours] !== dp[i - 1][remainingHours]) {
        const selected = normalized[i - 1];
        chosen.push(selected);
        remainingHours -= selected.duration;
      }
    }

    const result = {
      selectedTasks: chosen.reverse(),
      totalImpact: dp[n][capacity],
      totalDuration: chosen.reduce((sum, task) => sum + task.duration, 0)
    };

    await Log("backend", "info", "service", "Vehicle scheduler completed");
    return result;
  } catch (error) {
    await Log("backend", "error", "service", `Scheduler failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  calculate_optimal_schedule
};
