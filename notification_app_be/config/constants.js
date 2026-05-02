require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://20.207.122.201/evaluation-service";
const AUTH_API = `${BASE_URL}/auth`;
const NOTIFICATION_API = `${BASE_URL}/notifications`;
const LOG_API = `${BASE_URL}/logs`;

const EMAIL = process.env.EMAIL || "";
const NAME = process.env.NAME || "";
const ROLL_NO = process.env.ROLL_NO || "";
const ACCESS_CODE = process.env.ACCESS_CODE || "";
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";

module.exports = {
  BASE_URL,
  AUTH_API,
  NOTIFICATION_API,
  LOG_API,
  EMAIL,
  NAME,
  ROLL_NO,
  ACCESS_CODE,
  CLIENT_ID,
  CLIENT_SECRET
};
