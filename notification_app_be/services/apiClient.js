const fetchModule = require("node-fetch");
const fetch = fetchModule.default || fetchModule;
const Log = require("../../logging_middleware/logger");
const { obtain_notification_token } = require("../config/authService");

async function create_headers(additional = {}) {
  const token = await obtain_notification_token();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...additional
  };
}

async function api_fetch(url, options = {}) {
  const requestLabel = `${options.method || "GET"} ${url}`;

  try {
    await Log("backend", "debug", "service", `Starting api call: ${requestLabel}`);

    const headers = await create_headers(options.headers);
    const fetchOptions = {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: options.timeout || 15000
    };

    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;

    const rawText = await response.text();
    let payload;

    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch (parseError) {
      payload = rawText;
    }

    if (!response.ok) {
      await Log(
        "backend",
        "error",
        "service",
        `api call failed: ${requestLabel} status=${response.status} time=${responseTime}ms`
      );
      const message = payload && payload.message ? payload.message : `HTTP ${response.status}`;
      throw new Error(message);
    }

    await Log(
      "backend",
      "info",
      "service",
      `api call succeeded: ${requestLabel} time=${responseTime}ms`
    );

    return payload;
  } catch (err) {
    await Log("backend", "error", "service", `api call error: ${requestLabel} ${err.message}`);
    throw err;
  }
}

module.exports = {
  api_fetch
};
