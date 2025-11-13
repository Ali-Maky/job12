const BusboyNS = require("busboy");
const { google } = require("googleapis");
const { getAuth } = require("./_google");
const stream = require('stream');

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  try {
    const { fields, file } = await parseMultipart(req);
    if (!file) return res.status(400).json({ ok:false, error:"No file uploaded" });

    // The ID of the specific folder in your My Drive that is shared with the SA.
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || ""; 
    // IMPORTANT: Get the email of the account whose quota you want to use (YOUR EMAIL)
    const quotaUserEmail = process.env.GOOGLE_QUOTA_USER_EMAIL; 
    
    if (!folderId) return res.status(500).json({ ok:false, error:"Missing GOOGLE_DRIVE_FOLDER_ID" });
    if (!quotaUserEmail) return res.status(500).json({ ok:false, error:"Missing GOOGLE_QUOTA_USER_EMAIL for My Drive" });

    // --- Create a Readable Stream from the Buffer ---
    const bufferStream = new stream.Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null); // End the stream
    // ----------------------------------------------------

    // --- Authentication with Impersonation (Requires Setup) ---
    // NOTE: If getAuth() does not handle impersonation (Domain-Wide Delegation), 
    // this will be the crash point, but we proceed assuming the backend setup handles it.
    const auth = getAuth(); 
    
    // We add the quotaUser parameter to the drive instance
    const drive = google.drive({ 
        version: "v3", 
        auth,
        quotaUser: quotaUserEmail // This associates the request with your quota
    });

    const safeName = file.filename.replace(/[^\w.\-]+/g, "_");
    const name = (fields.jobId || "unknown") + "__" + Date.now() + "__" + safeName;

    const created = await drive.files.create({
      // We REMOVE supportsAllDrives: true and driveId, as this is My Drive.
      // We rely on the Service Account being shared access to the folderId.
      requestBody: { 
          name, 
          parents: [folderId], 
          mimeType: file.mimetype 
      },
      media: { mimeType: file.mimetype, body: bufferStream }, 
      fields: "id, webViewLink"
    });

    const id = created.data.id;
    
    // Set permissions so anyone with the link can view the file (necessary for webViewLink)
    await drive.permissions.create({ 
        fileId: id, 
        requestBody: { role:"reader", type:"anyone" },
        // Removed supportsAllDrives: true
    });
    
    const webViewLink = created.data.webViewLink || ("https://drive.google.com/file/d/" + id + "/view");

    return res.status(200).json({ ok:true, cvUrl: webViewLink, cvFileId: id });
  } catch (e) {
    console.error("UPLOAD ERROR", e);
    return res.status(500).json({ ok:false, error: e?.message || "Upload failed" });
  }
};

function parseMultipart(req){
  return new Promise((resolve,reject)=>{
    const bb = BusboyNS({ headers: req.headers }); 
    const fields = {};
    let fileBuf, fileName = "", mime = "";
    bb.on("field",(name,val)=>{ fields[name]=val; });
    bb.on("file",(_, file, info)=>{
      fileName = (info && info.filename) || "cv";
      mime = (info && info.mimeType) || "application/octet-stream";
      const chunks = [];
      file.on("data",(d)=>chunks.push(d));
      file.on("end",()=> fileBuf = Buffer.concat(chunks));
    });
    bb.on("error",reject);
    bb.on("close",()=> resolve({ fields, file: fileBuf ? { buffer:fileBuf, filename:fileName, mimetype:mime } : undefined }));
    req.pipe(bb);
  });
}
