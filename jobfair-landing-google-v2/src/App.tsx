import React from "react";
const ZAIN_LOGO_URL = "/zain-logo.png";

type Job = {
  id: string; title: string; company: string; location: string; type: string;
  tags: string[]; description: string; responsibilities: string[]; requirements: string[];
};
type NewJobInput = {
  id?: string; title?: string; company?: string; location?: string; type?: string;
  tags?: string | string[]; description?: string; responsibilities?: string | string[]; requirements?: string | string[];
};

const INITIAL_JOBS: Job[] = [
  { id:"1", title:"Frontend Developer", company:"ZINC Partners", location:"Baghdad, IQ (Hybrid)", type:"Full-time",
    tags:["React","Tailwind","UI"],
    description:"Build and polish user-facing features, collaborate with designers, and ensure high performance across modern browsers.",
    responsibilities:["Develop responsive interfaces using React","Collaborate with product and design on component systems","Write clean, well-tested code and perform code reviews"],
    requirements:["2+ years experience with React","Solid knowledge of HTML/CSS/JS","Familiarity with REST/GraphQL"] },
  { id:"2", title:"Data Analyst", company:"Zain Iraq", location:"Basra, IQ (On-site)", type:"Contract",
    tags:["SQL","Power BI","Python"],
    description:"Turn data into insights and dashboards that guide leadership decisions. Own data quality and storytelling.",
    responsibilities:["Build reports and dashboards (Power BI/Tableau)","Perform ETL and data validation","Partner with stakeholders to define KPIs"],
    requirements:["3+ years in analytics","Advanced SQL, basic Python","Data viz portfolio"] }
];

const ADMIN_FLAG = "jobfair-admin";
function normalizeJob(j: NewJobInput): Job {
  const toList = (s?: string | string[]) =>
    Array.isArray(s) ? s : typeof s === "string" && s ? s.split(/[;\n]/).map(x=>x.trim()).filter(Boolean) : [];
  const toTags = (s?: string | string[]) =>
    Array.isArray(s) ? s : typeof s === "string" && s ? s.split(",").map(x=>x.trim()).filter(Boolean) : [];
  return {
    id: j.id || (typeof crypto!=="undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2)),
    title:(j.title||"Untitled role").trim(), company:(j.company||"").trim(), location:(j.location||"").trim(), type:(j.type||"Full-time").trim(),
    tags: toTags(j.tags), description: j.description || "", responsibilities: toList(j.responsibilities), requirements: toList(j.requirements)
  };
}
function useSearch(jobs: Job[], query: string, type: string) {
  return React.useMemo(() => {
    let list = jobs||[]; if (type && type!=="All") list = list.filter(j=>j.type===type);
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(j => [j.title,j.company,j.location,(j.tags||[]).join(" ")].join(" ").toLowerCase().includes(q));
  }, [jobs,query,type]);
}
function isAdmin(){ try { return localStorage.getItem(ADMIN_FLAG)==="1"; } catch { return false; } }
function setAdmin(flag:boolean){ try { flag?localStorage.setItem(ADMIN_FLAG,"1"):localStorage.removeItem(ADMIN_FLAG);} catch {} }

export default function App(){
  const [jobs,setJobs] = React.useState<Job[]>(() => {
    try { const cached = JSON.parse(localStorage.getItem("jobfair-jobs") || "null"); return Array.isArray(cached)?cached:INITIAL_JOBS; } catch { return INITIAL_JOBS; }
  });
  const [query,setQuery] = React.useState(""); const [type,setType] = React.useState("All");
  const [selected,setSelected] = React.useState<Job|null>(null);
  const [submitted,setSubmitted] = React.useState<Record<string,boolean>>({});
  const [adminState,setAdminState] = React.useState(isAdmin());
  const [showAdminLogin,setShowAdminLogin] = React.useState(false);
  const [showAdd,setShowAdd] = React.useState(false);

  React.useEffect(()=>{ try{ localStorage.setItem("jobfair-jobs", JSON.stringify(jobs)); }catch{} },[jobs]);
  const results = useSearch(jobs, query, type);

  function deleteJob(id:string){ if(!adminState) return; if(!confirm("Delete this vacancy?")) return; setJobs(prev=>prev.filter(j=>j.id!==id)); }

  return (
    <div>
      <div className="header">
        <div className="container hstack">
          <a href="https://www.iq.zain.com" target="_blank" rel="noopener noreferrer" className="hstack" style={{gap:8}}>
            <img src={ZAIN_LOGO_URL} alt="Zain Iraq" className="logo" />
          </a>
          <h1 className="title">Woman In Tech 2025 - Job Fair</h1>
          <div className="spacer" />
          {!adminState ? (
            <button className="btn-outline" onClick={()=>setShowAdminLogin(true)}>Organizer sign in</button>
          ) : (
            <div className="hstack">
              <span className="chip">Admin</span>
              <button className="btn-outline" onClick={()=>{ setAdmin(false); setAdminState(false); }}>Sign out</button>
            </div>
          )}
        </div>
      </div>

      <section className="container" style={{paddingTop:12}}>
        <div className="grid grid-2">
          <input placeholder="Search by title, company, location, or tag…" value={query} onChange={e=>setQuery(e.target.value)} />
          <select value={type} onChange={e=>setType(e.target.value)}>
            {["All", ...Array.from(new Set((jobs||[]).map(j=>j.type)))].map(t=> <option key={t}>{t}</option>)}
          </select>
        </div>
      </section>

      <section className="container" style={{paddingTop:12}}>
        {!adminState ? (
          <div className="card muted">Organizers: <button className="btn-outline" onClick={()=>setShowAdminLogin(true)}>sign in</button> to add or delete vacancies.</div>
        ) : (
          <div className="hstack" style={{justifyContent:"space-between"}}>
            <div className="muted">Admin can add or remove vacancies. Changes are saved locally (no DB).</div>
            <button className="btn" onClick={()=>setShowAdd(true)}>+ Add vacancy</button>
          </div>
        )}
      </section>

      <section className="container" style={{padding:"16px 16px 80px"}}>
        {results.length===0 ? (
          <div className="card muted" style={{textAlign:"center"}}>No vacancies found. Try a different search.</div>
        ) : (
          <div className="grid grid-3">
            {results.map(job => (
              <button key={job.id} className="card" style={{textAlign:"left"}} onClick={()=>setSelected(job)}>
                <div className="hstack" style={{justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:18}}>{job.title}</div>
                    <div className="muted" style={{marginTop:4,fontSize:14}}>{job.company} • {job.location}</div>
                  </div>
                  <div className="hstack" style={{gap:8}}>
                    <span className="pill">{job.type}</span>
                    {adminState && <button className="danger" onClick={(e)=>{e.stopPropagation(); deleteJob(job.id);}}>Delete</button>}
                  </div>
                </div>
                <p style={{marginTop:8}}>{job.description}</p>
                <div className="hstack" style={{gap:8,flexWrap:"wrap",marginTop:8}}>
                  {(job.tags||[]).map(t => <span key={t} className="chip">#{t}</span>)}
                </div>
                {submitted[job.id] && <div style={{marginTop:12}} className="pill">Application submitted</div>}
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && <JobModal job={selected} onClose={()=>setSelected(null)} onSubmitted={(id)=>setSubmitted(s=>({...s,[id]:true}))} />}
      {showAdminLogin && <AdminLoginModal onClose={()=>setShowAdminLogin(false)} onSuccess={()=>{ setAdmin(true); setAdminState(true); setShowAdminLogin(false); }} />}
      {adminState && showAdd && <AddVacancyModal onClose={()=>setShowAdd(false)} onSave={(j)=>{ setJobs(prev=>[normalizeJob(j), ...prev]); setShowAdd(false); }} />}

      <div className="footer" style={{marginTop:24}}>
        <div className="container hstack" style={{gap:10,padding:"16px 16px"}}>
          <img src={ZAIN_LOGO_URL} alt="Zain Iraq" className="logo" />
          <span className="muted">© {new Date().getFullYear()} CER — All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}

function AdminLoginModal({onClose,onSuccess}:{onClose:()=>void; onSuccess:()=>void;}){
  const [code,setCode] = React.useState(""); const [error,setError] = React.useState("");
  function submit(e:React.FormEvent){ e.preventDefault(); const PASS=(window as any)?.ADMIN_PASSCODE || "ZAIN-ADMIN"; if(code.trim()===PASS){ setError(""); onSuccess(); } else setError("Invalid passcode. Contact organizer."); }
  return (<div className="modal"><div className="backdrop" onClick={onClose} aria-hidden/><div className="modalCard" style={{maxWidth:480}}>
    <h2 style={{margin:0,fontWeight:800,fontSize:18}}>Organizer sign in</h2>
    <p className="muted" style={{marginTop:8,fontSize:14}}>Enter the admin passcode to manage vacancies.</p>
    <form onSubmit={submit} style={{marginTop:12,display:"grid",gap:8}}>
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter passcode" />
      {error && <div style={{background:"#fee2e2",color:"#b91c1c",padding:"8px 12px",borderRadius:12,fontSize:14}}>{error}</div>}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
        <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn">Sign in</button>
      </div>
    </form>
  </div></div>);
}

function AddVacancyModal({onClose,onSave}:{onClose:()=>void; onSave:(j:NewJobInput)=>void;}){
  const [form,setForm] = React.useState({title:"",company:"",location:"",type:"Full-time",tags:"",description:"",responsibilities:"",requirements:""});
  const [error,setError] = React.useState(""); const set=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setForm(f=>({...f,[k]:e.target.value}));
  function handleSubmit(e:React.FormEvent){ e.preventDefault(); if(!form.title.trim()) return setError("Title is required."); setError(""); onSave({...form}); }
  return (<div className="modal"><div className="backdrop" onClick={onClose} aria-hidden/><div className="modalCard">
    <div className="stickyHead"><h2 style={{margin:0,fontWeight:800,fontSize:20}}>Add Vacancy</h2><button className="btn-outline" onClick={onClose}>Close</button></div>
    <form onSubmit={handleSubmit} style={{display:"grid",gap:12}}>
      <div><label>Title*</label><input value={form.title} onChange={set("title")} placeholder="Backend Developer" /></div>
      <div className="grid grid-2">
        <div><label>Company</label><input value={form.company} onChange={set("company")} placeholder="Zain Iraq" /></div>
        <div><label>Location</label><input value={form.location} onChange={set("location")} placeholder="Baghdad, IQ" /></div>
      </div>
      <div><label>Type</label><select value={form.type} onChange={set("type")}>{["Full-time","Part-time","Contract","Internship","Temporary"].map(t=><option key={t}>{t}</option>)}</select></div>
      <div><label>Tags (comma separated)</label><input value={form.tags} onChange={set("tags")} placeholder="React, Tailwind, UI" /></div>
      <div><label>Description</label><textarea rows={4} value={form.description} onChange={set("description")} /></div>
      <div className="grid grid-2">
        <div><label>Responsibilities (semicolon or new line)</label><textarea rows={4} value={form.responsibilities} onChange={set("responsibilities")} placeholder={"Build dashboards;\nValidate data"} /></div>
        <div><label>Requirements (semicolon or new line)</label><textarea rows={4} value={form.requirements} onChange={set("requirements")} placeholder={"3+ years SQL;\nPower BI"} /></div>
      </div>
      {error && <div style={{background:"#fee2e2",color:"#b91c1c",padding:"8px 12px",borderRadius:12,fontSize:14}}>{error}</div>}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
        <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn">Save vacancy</button>
      </div>
    </form>
  </div></div>);
}

function JobModal({job,onClose,onSubmitted}:{job:Job;onClose:()=>void;onSubmitted:(id:string)=>void;}){
  const [name,setName] = React.useState(""); const [email,setEmail] = React.useState(""); const [phone,setPhone] = React.useState(""); const [file,setFile] = React.useState<File|null>(null);
  const [error,setError] = React.useState(""); const [ok,setOk] = React.useState(false);
  function validate(){ if(!name.trim()) return "Please enter your full name."; if(!email.trim()) return "Please enter your email."; if(!file) return "Please attach your CV."; return null; }
  async function readJsonOrText(resp:Response){ const ct=resp.headers.get("content-type")||""; const raw=await resp.text(); if(ct.includes("application/json")){ try{return{ok:true,data:JSON.parse(raw)}}catch{return{ok:false,error:"Invalid JSON from server:\n"+raw.slice(0,500)}}} return {ok:false,error:raw.slice(0,1000)||`HTTP ${resp.status}`}; }
  async function handleSubmit(e:React.FormEvent){ e.preventDefault(); const v=validate(); if(v){ setError(v); setOk(false); return; } setError("");
    try{
      let cvUrl="", cvFileId="";
      if(file){ const fd=new FormData(); fd.append("jobId",job.id); fd.append("file",file,file.name); const r=await fetch("/api/upload",{method:"POST",body:fd}); const j=await readJsonOrText(r); if(!r.ok||!j.ok||!j.data?.ok) throw new Error(j.data?.error||j.error||"Upload failed"); cvUrl=j.data.cvUrl; cvFileId=j.data.cvFileId; }
      const r2=await fetch("/api/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ jobId:job.id, jobTitle:job.title, company:job.company, location:job.location, type:job.type, tags:(job.tags||[]).join(","), name,email,phone,cvUrl,cvFileId })});
      const j2=await readJsonOrText(r2); if(!r2.ok||!j2.ok||!j2.data?.ok) throw new Error(j2.data?.error||j2.error||"Could not save application");
      setOk(true); onSubmitted(job.id); setName(""); setEmail(""); setPhone(""); setFile(null);
    }catch(err:any){ setOk(false); setError(err?.message||"Submission failed"); }
  }
  return (<div className="modal"><div className="backdrop" onClick={onClose} aria-hidden/><div className="modalCard">
    <div className="stickyHead">
      <div><h2 style={{margin:0,fontWeight:800,fontSize:20}}>{job.title}</h2><div className="muted" style={{marginTop:4,fontSize:14}}>{job.company} • {job.location} • {job.type}</div></div>
      <button className="btn-outline" onClick={onClose}>Close</button>
    </div>
    <div className="grid grid-2">
      <div>
        <p>{job.description}</p>
        {job.responsibilities.length>0 && <div style={{marginTop:16}}><div style={{fontWeight:800}}>Responsibilities</div><ul>{job.responsibilities.map((r,i)=><li key={i}>{r}</li>)}</ul></div>}
        {job.requirements.length>0 && <div style={{marginTop:16}}><div style={{fontWeight:800}}>Requirements</div><ul>{job.requirements.map((r,i)=><li key={i}>{r}</li>)}</ul></div>}
      </div>
      <form onSubmit={handleSubmit} className="card" style={{padding:16}}>
        <div style={{fontWeight:800,marginBottom:8}}>Apply for this role</div>
        <div className="muted" style={{fontSize:14,marginBottom:12}}>Uploads go to Google Drive; details are appended to Google Sheets.</div>
        <label>Full name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
        <label style={{marginTop:8}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" />
        <label style={{marginTop:8}}>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+964 …" />
        <label style={{marginTop:8}}>CV (PDF / DOCX)</label>
        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>setFile(e.target.files?.[0]||null)} />
        {error && <div style={{background:"#fee2e2",color:"#b91c1c",padding:"8px 12px",borderRadius:12,fontSize:14,marginTop:8}}>{error}</div>}
        {ok && <div style={{background:"#ecfdf5",color:"#065f46",padding:"8px 12px",borderRadius:12,fontSize:14,marginTop:8}}>Submitted! Thank you.</div>}
        <button type="submit" className="btn" style={{marginTop:12,width:"100%"}}>Submit Application</button>
        <div className="muted" style={{fontSize:12,marginTop:8}}>By submitting, you consent to processing your information for this job opportunity.</div>
      </form>
    </div>
  </div></div>);
}
