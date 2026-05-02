/**
 * constants.js
 * -----------------------------------------
 * Shared runtime constants for backend services.
 */

require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://20.207.122.201/evaluation-service";
const LOG_API_URL = `${BASE_URL}/logs`;
const AUTH_API_URL = `${BASE_URL}/auth`;
const REGISTER_API_URL = `${BASE_URL}/register`;

const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
const EMAIL = process.env.EMAIL || "";
const NAME = process.env.NAME || "";
const ROLL_NO = process.env.ROLL_NO || "";
const ACCESS_CODE = process.env.ACCESS_CODE || "";

const STACK = {
  BACKEND: "backend",
  FRONTEND: "frontend"
};

// 🔹 Allowed Log Levels
const LEVEL = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal"
};

// 🔹 Backend Packages (as per problem statement)
const PACKAGE = {
  CACHE: "cache",
  CONTROLLER: "controller",
  CRON_JOB: "cron_job",
  DB: "db",
  DOMAIN: "domain",
  HANDLER: "handler",
  REPOSITORY: "repository",
  ROUTE: "route",
  SERVICE: "service",

  // 🔹 Common (usable in both FE & BE)
  AUTH: "auth",
  CONFIG: "config",
  MIDDLEWARE: "middleware",
  UTILS: "utils"
};

// 🔹 Export everything
module.exports = {
  BASE_URL,
  LOG_API_URL,
  AUTH_API_URL,
  REGISTER_API_URL,
  ACCESS_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET,
  EMAIL,
  NAME,
  ROLL_NO,
  ACCESS_CODE,
  STACK,
  LEVEL,
  PACKAGE
};