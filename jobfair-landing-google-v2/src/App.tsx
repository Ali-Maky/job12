import React from "react";
import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";

/** ---- Assets ----
 * Put your Zain logo at /public/zain-logo.png (or edit this path).
 */
const ZAIN_LOGO_URL = "/zain-logo.png";

/** ---- Demo data (you can delete/replace) ---- */
type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
};

const INITIAL_JOBS: Job[] = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "ZINC Partners",
    location: "Baghdad, IQ (Hybrid)",
    type: "Full-time",
    tags: ["React", "Tailwind", "UI"],
    description:
      "Build and polish user-facing features, collaborate with designers, and ensure high performance across modern browsers.",
    responsibilities: [
      "Develop responsive interfaces using React and TailwindCSS",
      "Collaborate with product and design on component systems",
      "Write clean, well-tested code and perform code reviews",
    ],
    requirements: [
      "2+ years experience with React",
      "Solid knowledge of HTML/CSS/JS",
      "Familiarity with REST/GraphQL",
    ],
  },
  {
    id: "2",
    title: "Data Analyst",
    company: "Zain Iraq",
    location: "Basra, IQ (On-site)",
    type: "Contract",
    tags: ["SQL", "Power BI", "Python"],
    description:
      "Turn data into insights and dashboards that guide leadership decisions. Own data quality and storytelling.",
    responsibilities: [
      "Build reports and dashboards (Power BI/Tableau)",
      "Perform ETL and data validation",
      "Partner with stakeholders to define KPIs",
    ],
    requirements: ["3+ years in analytics", "Advanced SQL, basic Python", "Data viz portfolio"],
  },
];

const ADMIN_FLAG = "jobfair-admin";

/** ----------------- Helpers ----------------- */
function normalizeJob(j: Partial<Job>): Job {
  const splitList = (s?: string | string[]) =>
    Array.isArray(s)
      ? s
      : typeof s === "string" && s
      ? s.split(/[;\n]/).map((x) => x.trim()).filter(Boolean)
      : [];
  const splitTags = (s?: string | string[]) =>
    Array.isArray(s)
      ? s
      : typeof s === "string" && s
      ? s.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

  return {
    id:
      j.id ||
      (typeof crypto !== "undefined" && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).slice(2)),
    title: (j.title || "Untitled role").trim(),
    company: (j.company || "").trim(),
    location: (j.location || "").trim(),
    type: (j.type || "Full-time").trim(),
    tags: splitTags(j.tags || []),
    description: j.description || "",
    responsibilities: splitList(j.responsibilities || []),
    requirements: splitList(j.requirements || []),
  };
}

function useSearch(jobs: Job[], query: string, type: string) {
  return useMemo(() => {
    let list = jobs || [];
    if (type && type !== "All") list = list.filter((j) => j.type === type);
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((j) =>
      [j.title, j.company, j.location, (j.tags || []).join(" ")].join(" ").toLowerCase().includes(q)
    );
  }, [jobs, query, type]);
}

function isAdmin(): boolean {
  try {
    return localStorage.getItem(ADMIN_FLAG) === "1";
  } catch {
    return false;
  }
}

function setAdmin(v: boolean) {
  try {
    if (v) localStorage.setItem(ADMIN_FLAG, "1");
    else localStorage.removeItem(ADMIN_FLAG);
  } catch {}
}

/** --------------- Main App ------------------ */
export default function App() {
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("jobfair-jobs") || "null");
      // Ensure cached data is normalized to handle potential type issues on load
      return Array.isArray(cached) ? cached.map(normalizeJob) : INITIAL_JOBS; 
    } catch {
      return INITIAL_JOBS;
    }
  });
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [selected, setSelected] = useState<Job | null>(null);
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [admin, setAdminState] = useState(isAdmin());
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("jobfair-jobs", JSON.stringify(jobs));
    } catch {}
  }, [jobs]);

  const results = useSearch(jobs, query, type);

  function deleteJob(id: string) {
    if (!admin) return;
    if (!window.confirm("Delete this vacancy?")) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <a href="https://www.iq.zain.com" target="_blank" rel="noopener noreferrer">
              <img src={ZAIN_LOGO_URL} className="h-10 w-auto" alt="Zain Iraq" />
            </a>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Woman In Tech 2025 - Job Fair
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {!admin ? (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="rounded-2xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                title="Organizer sign in"
              >
                Organizer sign in
              </button>
            ) : (
              <>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Admin
                </span>
                <button
                  onClick={() => {
                    setAdmin(false);
                    setAdminState(false);
                  }}
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Search / Filter */}
      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="md:col-span-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500 shadow-sm"
            placeholder="Search by title, company, location, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500 shadow-sm appearance-none pr-8"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {["All", ...Array.from(new Set((jobs || []).map((j) => j.type)))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Admin controls */}
      <section className="mx-auto max-w-7xl px-6 py-4">
        {!admin ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            Organizers: <button className="underline hover:text-purple-600" onClick={() => setShowAdminLogin(true)}>sign in</button> to add or delete vacancies.
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Admin can add or remove vacancies. Changes are saved locally (no backend).
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition"
            >
              + Add vacancy
            </button>
          </div>
        )}
      </section>

      {/* Jobs grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No vacancies found. Try a different search.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelected(job)}
                className="group text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-lg transition hover:border-fuchsia-400 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-purple-800">{job.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {job.company} • {job.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-medium text-fuchsia-800">
                      {job.type}
                    </span>
                    {admin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteJob(job.id);
                        }}
                        className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-200 transition"
                        title="Delete vacancy"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-gray-700">{job.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(job.tags || []).map((t) => (
                    <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      #{t}
                    </span>
                  ))}
                </div>
                {submitted[job.id] && (
                  <div className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    Application submitted successfully!
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {selected && (
        <JobModal
          job={selected}
          onClose={() => setSelected(null)}
          // CALLS THE NEW UNIFIED API
          onSubmitted={(id) => setSubmitted((s) => ({ ...s, [id]: true }))}
        />
      )}
      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          onSuccess={() => {
            setAdmin(true);
            setAdminState(true);
            setShowAdminLogin(false);
          }}
        />
      )}
      {admin && showAdd && (
        <AddVacancyModal
          onClose={() => setShowAdd(false)}
          onSave={(j) => {
            setJobs((prev) => [normalizeJob(j), ...prev]);
            setShowAdd(false);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-500 flex items-center gap-3">
          <img src={ZAIN_LOGO_URL} alt="Zain Iraq" className="h-6 w-auto opacity-80" />
          <span>© {new Date().getFullYear()} CER — All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

/** --------------- Admin Login Modal ------------------ */
function AdminLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const PASS = (window as any)?.ADMIN_PASSCODE || "ZAIN-ADMIN"; // overrideable in console
    if (code.trim() === PASS) {
      setError("");
      onSuccess();
    } else {
      setError("Invalid passcode. Contact organizer.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-purple-800">Organizer Sign In</h2>
        <p className="mt-2 text-sm text-gray-600">Enter the admin passcode to manage vacancies.</p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter passcode"
            className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** --------------- Add Vacancy Modal ------------------ */
function AddVacancyModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  // accept raw string fields; parent will call normalizeJob(...)
  onSave: (j: any) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    tags: "",
    description: "",
    responsibilities: "",
    requirements: "",
  });
  const [error, setError] = useState("");

  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    setError("");
    onSave({ ...form });
  }

  const formId = "add-vacancy-form";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-3xl bg-white shadow-xl h-[95svh] md:h-auto max-h-[95svh] md:max-h-[85svh] overflow-hidden flex flex-col md:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b bg-white/95 backdrop-blur px-6 py-4">
          <h2 className="text-2xl font-bold text-purple-800">Add New Vacancy</h2>
          <button onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
            Close
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-28">
          <form id={formId} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title*</label>
              <input className="w-full rounded-xl border border-gray-300 px-4 py-2" value={form.title} onChange={set("title")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Company</label>
              <input className="w-full rounded-xl border border-gray-300 px-4 py-2" value={form.company} onChange={set("company")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <input className="w-full rounded-xl border border-gray-300 px-4 py-2" value={form.location} onChange={set("location")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select className="w-full rounded-xl border border-gray-300 px-4 py-2" value={form.type} onChange={set("type")}>
                {["Full-time", "Part-time", "Contract", "Internship", "Temporary"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Tags (comma separated)</label>
              <input className="w-full rounded-xl border border-gray-300 px-4 py-2" value={form.tags} onChange={set("tags")} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea rows={4} className="w-full rounded-xl border border-gray-300 px-4 py-2" value={form.description} onChange={set("description")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Responsibilities (semicolon or new line)</label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-2"
                value={form.responsibilities}
                onChange={set("responsibilities")}
                placeholder={"Build dashboards;\nValidate data"}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Requirements (semicolon or new line)</label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-2"
                value={form.requirements}
                onChange={set("requirements")}
                placeholder={"3+ years SQL;\nPower BI"}
              />
            </div>
            {error && (
              <div className="md:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
          </form>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 border-t bg-white/95 backdrop-blur px-6 py-3">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button form={formId} type="submit" className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition">
              Save vacancy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** --------------- Job Modal (Apply) ------------------ */
function JobModal({
  job,
  onClose,
  onSubmitted,
}: {
  job: Job;
  onClose: () => void;
  onSubmitted: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email.";
    if (!file) return "Please attach your CV.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      setOk(false);
      return;
    }
    setError("");
    setLoading(true);

    try {
      // 1) Prepare Form Data for unified API endpoint
      const fd = new FormData();
      fd.append("jobId", job.id);
      fd.append("jobTitle", job.title);
      fd.append("company", job.company);
      fd.append("location", job.location);
      fd.append("type", job.type);
      fd.append("tags", (job.tags || []).join(",")); // Send tags as string
      
      fd.append("name", name);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("file", file as File, file!.name); // CV file

      // 2) Send unified request to new Firebase handler
      const resp = await fetch("/api/apply-job", { method: "POST", body: fd });
      
      let data;
      try {
        data = await resp.json();
      } catch (err) {
        throw new Error("Received non-JSON response from server.");
      }
      
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Submission failed (API Error).");
      }

      setOk(true);
      onSubmitted(job.id);
      setName("");
      setEmail("");
      setPhone("");
      setFile(null);
    } catch (err: any) {
      setOk(false);
      setError(err?.message || "Submission failed due to server error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-3xl rounded-t-3xl bg-white p-6 shadow-xl md:rounded-3xl h-[95vh] md:h-auto max-h-[95vh] md:max-h-[85vh] overflow-y-auto overscroll-contain">
        <div className="flex items-start justify-between gap-6 sticky top-0 bg-white/95 backdrop-blur -mx-6 px-6 pt-2 pb-3 border-b">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-purple-800">{job.title}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {job.company} • {job.location} • {job.type}
            </p>
          </div>
          <button className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {/* Left: description */}
          <div>
            <p className="text-gray-800">{job.description}</p>
            {job.responsibilities.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900">Responsibilities</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {job.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {job.requirements.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900">Requirements</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {job.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: apply form */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 p-6 pb-24 shadow-md bg-white">
            <h3 className="text-lg font-bold text-fuchsia-800">Apply for this Role</h3>
            <p className="mb-4 mt-1 text-sm text-gray-600">
              Your CV will be stored securely in Firebase Storage.
            </p>

            <label className="mb-2 block text-sm font-medium">Full name*</label>
            <input
              className="mb-3 w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
            />

            <label className="mb-2 mt-1 block text-sm font-medium">Email*</label>
            <input
              type="email"
              className="mb-3 w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={loading}
            />

            <label className="mb-2 mt-1 block text-sm font-medium">Phone</label>
            <input
              className="mb-3 w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+964 …"
              disabled={loading}
            />

            <label className="mb-2 mt-1 block text-sm font-medium">CV (PDF / DOCX)*</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-fuchsia-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-fuchsia-700 disabled:file:opacity-50"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
            />

            {error && <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {ok && <div className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">Submitted! We have received your application.</div>}

            <button
              type="submit"
              className={`w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-95"
              }`}
              disabled={loading || ok}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>

            <p className="mt-3 text-xs text-gray-500">
              By submitting, you consent to processing your information for this job opportunity.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
