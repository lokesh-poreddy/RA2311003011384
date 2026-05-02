const fetchModule = require("node-fetch");
const fetch = fetchModule.default || fetchModule;
const {
  AUTH_API_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  EMAIL,
  NAME,
  ROLL_NO,
  ACCESS_CODE
} = require("./constants");

let cached_token = "";
let token_expiry_ms = 0;

async function request_auth_token() {
  if (!EMAIL || !NAME || !ROLL_NO || !ACCESS_CODE || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing auth credentials in environment");
  }

  const response = await fetch(AUTH_API_URL, {
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
    const reason = payload.message || response.statusText || "unknown auth failure";
    throw new Error(`Token request failed: ${reason}`);
  }

  cached_token = payload.access_token;
  token_expiry_ms = Date.now() + ((payload.expires_in || 3600) * 1000);
  return cached_token;
}

async function obtain_access_token() {
  if (cached_token && Date.now() + 60000 < token_expiry_ms) {
    return cached_token;
  }

  cached_token = "";
  token_expiry_ms = 0;
  return request_auth_token();
}

module.exports = {
  obtain_access_token,
  request_auth_token
};
