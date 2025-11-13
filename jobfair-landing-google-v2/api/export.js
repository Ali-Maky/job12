const { google } = require("googleapis");
const { getAuth } = require("./_google");

function csvEscape(v){
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}

module.exports = async (req, res) => {
  const provided = (req.query && req.query.key) || "";
  const allowed = process.env.EXPORT_KEY || "ZAIN-ADMIN";
  if (provided !== allowed) return res.status(401).json({ ok:false, error:"Unauthorized" });

  try{
    const sheetId = process.env.GOOGLE_SHEETS_ID || "";
    if (!sheetId) return res.status(500).json({ ok:false, error:"Missing GOOGLE_SHEETS_ID" });

    const auth = getAuth();
    const sheets = google.sheets({ version:"v4", auth });

    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range:"A:Z" });
    const rows = (resp.data.values || []);

    const lines = [];
    if (!rows.length){
      lines.push("timestamp,jobId,jobTitle,company,location,type,tags,name,email,phone,cvUrl,cvFileId");
    } else {
      for (const r of rows){ lines.push(r.map(csvEscape).join(",")); }
    }

    const csv = lines.join("\n");
    res.setHeader("Content-Type","text/csv; charset=utf-8");
    res.setHeader("Content-Disposition",'attachment; filename="applications-export.csv"');
    return res.status(200).send(csv);
  }catch(e){
    console.error("EXPORT ERROR", e);
    return res.status(500).json({ ok:false, error: e?.message || "Export failed" });
  }
};
