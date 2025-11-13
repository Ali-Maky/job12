const BusboyNS = require("busboy");
const { google } = require("googleapis");
const { getAuth } = require("./_google");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  try {
    const { fields, file } = await parseMultipart(req);
    if (!file) return res.status(400).json({ ok:false, error:"No file uploaded" });

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
    if (!folderId) return res.status(500).json({ ok:false, error:"Missing GOOGLE_DRIVE_FOLDER_ID" });

    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const safeName = file.filename.replace(/[^\w.\-]+/g, "_");
    const name = (fields.jobId || "unknown") + "__" + Date.now() + "__" + safeName;

    const created = await drive.files.create({
      requestBody: { name, parents: [folderId] },
      media: { mimeType: file.mimetype, body: Buffer.from(file.buffer) },
      fields: "id, webViewLink"
    });

    const id = created.data.id;
    await drive.permissions.create({ fileId: id, requestBody: { role:"reader", type:"anyone" } });
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
export const config = {
  api: {
    bodyParser: false, // <--- This tells Vercel/Next.js to leave the body as a stream
  },
};
