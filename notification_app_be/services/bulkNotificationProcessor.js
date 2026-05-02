const Log = require("../../logging_middleware/logger");

async function process_bulk_notifications(notificationPayloads) {
  try {
    await Log("backend", "info", "service", "Bulk notification processing started");

    if (!Array.isArray(notificationPayloads)) {
      throw new Error("Payload must be an array");
    }

    const batches = [];
    const batchSize = 10;

    for (let i = 0; i < notificationPayloads.length; i += batchSize) {
      batches.push(notificationPayloads.slice(i, i + batchSize));
    }

    const results = await Promise.allSettled(
      batches.map(async (batch, index) => {
        await Log(
          "backend",
          "debug",
          "service",
          `Processing bulk batch ${index + 1}/${batches.length}`
        );

        return Promise.all(batch.map(async (item) => {
          await Log(
            "backend",
            "info",
            "service",
            `Queued notification for ${item.recipient || item.ID || "unknown"}`
          );
          return {
            status: "queued",
            payload: item
          };
        }));
      })
    );

    const summary = results.map((entry, index) => ({
      batch: index + 1,
      status: entry.status,
      value: entry.status === "fulfilled" ? entry.value : entry.reason.message
    }));

    await Log("backend", "info", "service", "Bulk notification processing completed");
    return { summary };
  } catch (error) {
    await Log("backend", "error", "service", `Bulk processing failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  process_bulk_notifications
};
