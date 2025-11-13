const Busboy = require("busboy");
const {
  db,
  storage,
  collection,
  addDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  serverTimestamp,
} = require("./_firebase");

// CRITICAL: Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  let cvUrl = null;
  let applicationData = {};

  try {
    // 1. Handle File Upload (Parsing and Buffering)
    const { fields, file } = await parseMultipart(req);
    
    if (!file) return res.status(400).json({ ok: false, error: "No CV file uploaded" });
    
    // Convert fields object to string values for Firestore
    for (const key in fields) {
      applicationData[key] = String(fields[key]);
    }

    // 2. Upload File to Firebase Storage
    const safeName = file.filename.replace(/[^\w.\-]+/g, "_");
    const storagePath = `cvs/${applicationData.jobId || "unknown"}/${Date.now()}_${safeName}`;
    
    const storageRef = ref(storage, storagePath);
    
    // uploadBytes automatically handles the Buffer
    const snapshot = await uploadBytes(storageRef, file.buffer, {
      contentType: file.mimetype,
    });
    
    cvUrl = await getDownloadURL(snapshot.ref);

    // 3. Log Application Details to Firestore
    const applicationsCollection = collection(db, "applications");
    
    await addDoc(applicationsCollection, {
      ...applicationData,
      cvUrl: cvUrl,
      timestamp: serverTimestamp(),
    });

    return res.status(200).json({ ok: true, cvUrl, message: "Application submitted successfully to Firebase." });
  } catch (e) {
    console.error("FIREBASE SUBMISSION ERROR:", e);
    // Return error message if known, or general failure message
    return res.status(500).json({ ok: false, error: e?.message || "Application submission failed (Firebase backend error)." });
  }
};

// Reusable function to parse multipart form data (Busboy)
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    const fields = {};
    let fileBuf;
    let fileName = "";
    let mime = "";

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("file", (fieldname, file, info) => {
      fileName = info.filename || "cv";
      mime = info.mimeType || "application/octet-stream";
      const chunks = [];
      
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        fileBuf = Buffer.concat(chunks);
      });
    });

    bb.on("error", reject);
    bb.on("close", () =>
      resolve({
        fields,
        file: fileBuf ? { buffer: fileBuf, filename: fileName, mimetype: mime } : undefined,
      })
    );

    req.pipe(bb);
  });
}
