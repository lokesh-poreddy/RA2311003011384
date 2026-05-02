/*
 * database.js
 * MySQL connection pool and schema initialization
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "notification_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

function get_pool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

async function initialize_database() {
  // connect without a database first so we can create it
  const tempConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  });

  await tempConn.execute(
    "CREATE DATABASE IF NOT EXISTS `" + DB_CONFIG.database + "`"
  );
  await tempConn.end();

  const db = get_pool();

  // students table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
      studentID    INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(255) NOT NULL,
      email        VARCHAR(255) NOT NULL UNIQUE,
      rollNo       VARCHAR(50)  NOT NULL UNIQUE,
      createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_rollNo (rollNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // notifications table with composite indexes for fast lookups
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id               VARCHAR(64) PRIMARY KEY,
      studentID        INT NULL,
      notificationType ENUM('Event', 'Result', 'Placement') NOT NULL DEFAULT 'Event',
      message          TEXT NOT NULL,
      isRead           BOOLEAN DEFAULT FALSE,
      createdAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_student_read (studentID, isRead),
      INDEX idx_type_created (notificationType, createdAt),
      INDEX idx_created (createdAt),
      FOREIGN KEY (studentID) REFERENCES students(studentID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // queue table for async bulk processing
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notification_queue (
      queueID      INT AUTO_INCREMENT PRIMARY KEY,
      notificationID VARCHAR(64) NOT NULL,
      channel      ENUM('email', 'push', 'in_app') NOT NULL,
      status       ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
      retryCount   INT DEFAULT 0,
      maxRetries   INT DEFAULT 3,
      error        TEXT NULL,
      createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processedAt  TIMESTAMP NULL,
      INDEX idx_status (status),
      INDEX idx_notification (notificationID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log("[DB] MySQL database initialized successfully");
  return db;
}

async function close_database() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("[DB] Connection pool closed");
  }
}

module.exports = {
  get_pool,
  initialize_database,
  close_database,
  DB_CONFIG
};
