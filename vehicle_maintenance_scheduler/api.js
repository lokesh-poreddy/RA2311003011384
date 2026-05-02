const fetch = require("node-fetch");
const { BASE_URL, ACCESS_TOKEN } = require("../logging_middleware/constants");
const Log = require("../logging_middleware/logger");

const DEPOT_API = `${BASE_URL}/depots`;

async function fetchDepotData() {
  try {
    await Log("backend", "info", "api", "Fetching depot data");

    const response = await fetch(DEPOT_API, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    await Log("backend", "info", "api", "Depot data fetched successfully");

    return data;

  } catch (error) {
    await Log("backend", "error", "api", error.message);
    throw error;
  }
}

module.exports = fetchDepotData;