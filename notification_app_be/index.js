const express = require("express");
const app = express();

const notificationRoutes = require("./routes/routes");
const Log = require("../logging_middleware/logger");
const { initialize_database, close_database } = require("./config/database");

app.use(express.json());
app.use("/notifications", notificationRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

async function start_server() {
  try {
    // Initialize MySQL database and tables
    await initialize_database();
    console.log("✅ MySQL database connected and tables ready");

    app.listen(PORT, async () => {
      await Log("backend", "info", "service", `Server started on port ${PORT}`);
      console.log(`🚀 Server started on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/notifications`);
      console.log(`💊 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await close_database();
  process.exit(0);
});

start_server();