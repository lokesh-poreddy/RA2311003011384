const fetch = require("node-fetch");
const Log = require("../logging_middleware/logger");
const { BASE_URL } = require("../logging_middleware/constants");
const { obtain_access_token } = require("../logging_middleware/authService");
const { calculate_optimal_schedule } = require("./schedulerService");

const DEPOT_API = `${BASE_URL}/depots`;
const VEHICLE_API = `${BASE_URL}/vehicles`;

async function build_vehicle_maintenance_plan() {
  try {
    await Log("backend", "info", "controller", "Starting maintenance plan generation");

    const token = await obtain_access_token();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    const [depots, vehicles] = await Promise.all([
      fetch_data(DEPOT_API, headers, "depots"),
      fetch_data(VEHICLE_API, headers, "vehicles")
    ]);

    const availableHours = depots.reduce((sum, depot) => {
      return sum + Number(depot.MechanicHours || 0);
    }, 0);

    if (availableHours <= 0) {
      throw new Error("No mechanic hours available from depots");
    }

    const taskList = vehicles.map((entry) => ({
      taskId: entry.TaskID,
      duration: Number(entry.Duration || 0),
      impact: Number(entry.Impact || 0)
    }));

    const schedule = await calculate_optimal_schedule(taskList, availableHours);

    const result = {
      depotCount: depots.length,
      availableHours,
      selectedTasks: schedule.selectedTasks,
      totalImpact: schedule.totalImpact,
      totalDuration: schedule.totalDuration
    };

    await Log("backend", "info", "controller", "Maintenance plan generated successfully");
    return result;
  } catch (error) {
    await Log("backend", "error", "controller", `Maintenance plan error: ${error.message}`);
    throw error;
  }
}

async function fetch_data(url, headers, label) {
  const requestLabel = `GET ${label}`;
  try {
    await Log("backend", "debug", "service", `Fetching ${label} from evaluation API`);
    const response = await fetch(url, { method: "GET", headers, timeout: 15000 });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(`Failed ${requestLabel} status=${response.status}`);
    }

    if (!Array.isArray(body[label])) {
      throw new Error(`Invalid ${label} payload`);
    }

    await Log("backend", "info", "service", `${label} loaded successfully`);
    return body[label];
  } catch (err) {
    await Log("backend", "error", "service", `${requestLabel} failed: ${err.message}`);
    throw err;
  }
}

module.exports = {
  build_vehicle_maintenance_plan
};
