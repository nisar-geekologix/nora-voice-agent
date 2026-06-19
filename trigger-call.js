import dotenv from "dotenv";
dotenv.config();

// =========================================================================
// TWILIO CREDENTIALS CONFIGURATION
// You can either paste your credentials here directly, or add them to your .env file.
// =========================================================================
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";

// Phone Numbers (Must be in international E.164 format, e.g. +91XXXXXXXXXX)
const FROM_NUMBER = process.env.TWILIO_NUMBER || ""; // e.g., "+15709898569"
const TO_NUMBER = process.env.MY_NUMBER || ""; // e.g., "+919876543210"

// Your active Localtunnel URL (Do not include trailing slash)
const TUNNEL_URL = process.env.TUNNEL_URL || "";

// =========================================================================
// CALL TRIGGER LOGIC (Uses native Node.js fetch - No twilio package needed!)
// =========================================================================

async function triggerCall() {
  // Check for placeholder credentials
  if (
    ACCOUNT_SID.startsWith("YOUR_") ||
    AUTH_TOKEN.startsWith("YOUR_") ||
    FROM_NUMBER.startsWith("YOUR_") ||
    TO_NUMBER.startsWith("YOUR_")
  ) {
    console.error("❌ Error: Please open 'trigger-call.js' and configure your Twilio Account SID, Auth Token, and phone numbers first.");
    process.exit(1);
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`;

  // Twilio outbound call parameters
  const params = new URLSearchParams({
    To: TO_NUMBER,
    From: FROM_NUMBER,
    Url: `${TUNNEL_URL}/api/twilio-twiml`
  });

  // Basic authentication headers
  const authHeader = `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`;

  console.log(`📞 Triggering outbound call from ${FROM_NUMBER} to ${TO_NUMBER}...`);
  console.log(`🔗 Webhook TwiML route: ${TUNNEL_URL}/api/twilio-twiml`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success! Outbound call successfully initiated.`);
      console.log(`📡 Call SID: ${data.sid}`);
      console.log(`👉 Your mobile phone should ring in a few seconds. Answer it to speak to Nora!`);
    } else {
      console.error(`❌ Twilio API Error: [Status ${response.status}]`, data.message || data);
    }
  } catch (err) {
    console.error("❌ Network or request error while contacting Twilio:", err);
  }
}

triggerCall();
