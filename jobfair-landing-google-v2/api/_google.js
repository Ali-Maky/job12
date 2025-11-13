const { google } = require("googleapis");
function getAuth(){
  const b64 = process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64 || "";
  if (!b64) throw new Error("Missing GOOGLE_CLOUD_CREDENTIALS_BASE64");
  const json = Buffer.from(b64, "base64").toString("utf8");
  const creds = JSON.parse(json);
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets"
    ]
  });
}
module.exports = { getAuth };
