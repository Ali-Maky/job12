const { google } = require("googleapis");
const { getAuth } = require("./_google");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { jobId, jobTitle, company, location, type, tags, name, email, phone, cvUrl, cvFileId } = body;

    const sheetId = process.env.GOOGLE_SHEETS_ID || "";
    if (!sheetId) return res.status(500).json({ ok:false, error:"Missing GOOGLE_SHEETS_ID" });

    const auth = getAuth();
    const sheets = google.sheets({ version:"v4", auth });

    const values = [[
      new Date().toISOString(),
      jobId||"", jobTitle||"", company||"", location||"", type||"", tags||"",
      name||"", email||"", phone||"",
      cvUrl||"", cvFileId||""
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:Z",
      valueInputOption: "RAW",
      requestBody: { values }
    });

    return res.status(200).json({ ok:true });
  } catch (e) {
    console.error("APPLY ERROR", e);
    return res.status(500).json({ ok:false, error: e?.message || "Append failed" });
  }
};
