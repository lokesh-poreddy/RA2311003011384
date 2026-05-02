const fetchModule = require("node-fetch");
const fetch = fetchModule.default || fetchModule;
const {
  AUTH_API,
  EMAIL,
  NAME,
  ROLL_NO,
  ACCESS_CODE,
  CLIENT_ID,
  CLIENT_SECRET
} = require("./constants");

let token_cache = "";
let token_expiry = 0;

async function request_notification_token() {
  if (!EMAIL || !NAME || !ROLL_NO || !ACCESS_CODE || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing notification auth environment variables");
  }

  const response = await fetch(AUTH_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: EMAIL,
      name: NAME,
      rollNo: ROLL_NO,
      accessCode: ACCESS_CODE,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    const reason = payload.message || response.statusText || "auth request failed";
    throw new Error(reason);
  }

  token_cache = payload.access_token;
  token_expiry = Date.now() + ((payload.expires_in || 3600) * 1000);
  return token_cache;
}

async function obtain_notification_token() {
  if (token_cache && Date.now() < token_expiry - 60000) {
    return token_cache;
  }
  return request_notification_token();
}

module.exports = {
  obtain_notification_token
};
