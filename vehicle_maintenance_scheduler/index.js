const scheduleVehicles = require("./scheduler");

async function run() {
  // Example input (replace with API data)
  const tasks = [
    { id: 1, time: 2, score: 50 },
    { id: 2, time: 3, score: 70 },
    { id: 3, time: 4, score: 60 },
    { id: 4, time: 5, score: 80 }
  ];

  const maxHours = 8;

  const result = await scheduleVehicles(tasks, maxHours);

  console.log("Optimal Schedule:");
  console.log(result);
}

run();