/**
 * logger.js
 * -----------------------------------------
 * Centralized logging utility for backend
 * Sends logs to external evaluation API
 */

const fetch = require("node-fetch");
const {
  LOG_API_URL,
  STACK,
  LEVEL,
  PACKAGE,
  ACCESS_TOKEN
} = require("./constants");
const { obtain_access_token } = require("./authService");

/**
 * Send a structured log entry to the evaluation service.
 */
async function Log(stack, level, pkg, message) {
  try {
    if (!Object.values(STACK).includes(stack)) return;
    if (!Object.values(LEVEL).includes(level)) return;
    if (!Object.values(PACKAGE).includes(pkg)) return;
    if (!message || typeof message !== "string") return;

    const authToken = ACCESS_TOKEN || await obtain_access_token();
    if (!authToken) {
      console.error("Logging skipped: missing auth token");
      return;
    }

    const payload = {
      stack,
      level,
      package: pkg,
      message
    };

    const startTime = Date.now();
    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      console.error(`Log API failed ${response.status} (${responseTimeMs}ms)`);
    }
  } catch (err) {
    console.error("Logging error:", err.message);
  }
}

module.exports = Log;