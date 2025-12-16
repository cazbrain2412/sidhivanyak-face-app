"use client";

import { useEffect, useState } from "react";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [pfNumber, setPfNumber] = useState("");
  const [esicNumber, setEsicNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [division, setDivision] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [supervisorCode, setSupervisorCode] = useState("");
  const [documents, setDocuments] = useState([]);

  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  // selection
  const [selected, setSelected] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // filters
  const [filterZone, setFilterZone] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  useEffect(()=>{ loadAll(); loadSupervisors(); }, []);

  async function loadSupervisors() {
    try {
      const res = await fetch("/api/supervisors/list");
      const j = await res.json();
      setSupervisors(Array.isArray(j.supervisors) ? j.supervisors : []);
    } catch(e){ console.error(e); }
  }

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees/list");
      const j = await res.json();
      setEmployees(Array.isArray(j.employees) ? j.employees : []);

      const z = await fetch("/api/zones/list").then(r=>r.json()).catch(()=>({zones:[]}));
      setZones(z.zones || []);
      const d = await fetch("/api/divisions/list").then(r=>r.json()).catch(()=>({divisions:[]}));
      setDivisions(d.divisions || []);
      const dept = await fetch("/api/departments/list").then(r=>r.json()).catch(()=>({departments:[]}));
      setDepartments(dept.departments || []);

      setSelected({}); setSelectAll(false);
    } catch(err){ console.error(err); } finally { setLoading(false); }
  }

  function toggleSelect(code) { setSelected(prev=>({...prev,[code]:!prev[code]})); }
  function toggleSelectAll() {
    const next = !selectAll; setSelectAll(next);
    const sel = {};
    if (next) employees.forEach(e=> sel[e.code]=true);
    setSelected(sel);
  }

  // open full edit form
  function openEdit(emp) {
    setIsEdit(true);
    setEditingId(emp._id);
    setCode(emp.code||"");
    setName(emp.name||"");
    setEmail(emp.email||"");
    setMobile(emp.mobile||"");
    setAadhar(emp.aadhar||"");
    setPfNumber(emp.pfNumber||"");
    setEsicNumber(emp.esicNumber||"");
    setBankAccount(emp.bankAccount||"");
    setIfsc(emp.ifsc||"");
    setAddress(emp.address||"");
    setZone(emp.zone||"");
    setDivision(emp.division||"");
    setDepartment(emp.department||"");
    setCategory(emp.category||"");
    setSupervisorCode(emp.supervisorCode||"");
    setDocuments(Array.isArray(emp.documents)? emp.documents : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitForm(e) {
    e.preventDefault();
    const payload = {
      code: code.trim(), name: name.trim(), email, mobile, aadhar, pfNumber, esicNumber, bankAccount, ifsc, address,
      zone, division, department, category, supervisorCode, documents
    };
    try {
      if (isEdit && editingId) {
        const res = await fetch("/api/employees/update", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: editingId, ...payload })});
        const j = await res.json(); if (!res.ok) throw new Error(j?.error || "update failed");
        alert("Updated");
      } else {
        const res = await fetch("/api/employees/create", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        const j = await res.json(); if (!res.ok) throw new Error(j?.error || "create failed");
        alert("Created");
      }
      resetForm(); await loadAll();
    } catch(err){ console.error(err); alert("Save failed: " + (err.message||err)); }
  }

  function resetForm() {
    setIsEdit(false); setEditingId(null);
    setCode(""); setName(""); setEmail(""); setMobile("");
    setAadhar(""); setPfNumber(""); setEsicNumber("");
    setBankAccount(""); setIfsc(""); setAddress("");
    setZone(""); setDivision(""); setDepartment(""); setCategory(""); setSupervisorCode("");
    setDocuments([]);
  }

  async function deleteEmployee(emp) {
    if (!confirm("Delete " + emp.code + "?")) return;
    try {
      const res = await fetch("/api/employees/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: emp._id })});
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || "delete failed");
      alert("Deleted"); await loadAll();
    } catch(err){ console.error(err); alert("Delete failed: "+(err.message||err)); }
  }

  async function bulkAssignToSupervisor() {
    const codes = Object.keys(selected).filter(k=>selected[k]);
    if (codes.length===0) return alert("Select at least one");
    const sup = supervisorCode || prompt("Supervisor code:");
    if (!sup) return;
    try {
      const res = await fetch("/api/supervisors/bulk-assign", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ supervisorCode: sup.trim(), employeeCodes: codes })});
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || "bulk assign failed");
      alert("Bulk assigned: " + (j.updatedCount||0)); await loadAll();
    } catch(err){ console.error(err); alert("Bulk assign failed: " + (err.message||err)); }
  }

  async function assignSingle(emp) {
    const sup = supervisorCode || prompt("Supervisor code:");
    if (!sup) return;
    try {
      const res = await fetch("/api/supervisors/assign", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ supervisorCode: sup.trim(), employeeCode: emp.code })});
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || "assign failed");
      alert("Assigned"); await loadAll();
    } catch(err){ console.error(err); alert("Assign failed: " + (err.message||err)); }
  }

  // upload single file helper
  async function uploadFileAndAddToDocs(file, docType) {
    if (!file) return null;
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const dataUrl = reader.result;
          const res = await fetch("/api/uploads", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ filename: file.name, data: dataUrl })});
          const j = await res.json(); if (!res.ok) throw new Error(j?.error || "upload failed");
          const doc = { type: docType || file.name, url: j.url };
          setDocuments(prev => [...prev, doc]);
          resolve(doc);
        } catch(e){ reject(e); }
      };
      reader.onerror = e => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async function handleFileInput(e, docType) { const file = e.target.files && e.target.files[0]; if (!file) return; try { await uploadFileAndAddToDocs(file, docType); alert("Uploaded and added to documents"); } catch(err){ console.error("file upload err", err); alert("Upload failed: " + (err.message||err)); } }

  function removeDocument(idx) { setDocuments(prev => prev.filter((_,i)=>i!==idx)); }

  const filteredEmployees = employees.filter(emp => {
    if (filterZone && emp.zone !== filterZone) return false;
    if (filterDivision && emp.division !== filterDivision) return false;
    if (filterDepartment && emp.department !== filterDepartment) return false;
    return true;
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Employees</h1>

      <div className="flex gap-2 mb-4">
        <select value={filterZone} onChange={e=>setFilterZone(e.target.value)} className="border px-3 py-2 rounded">
          <option value="">All Zones</option>
          {zones.map(z => <option key={z._id} value={z.name}>{z.name}</option>)}
        </select>

        <select value={filterDivision} onChange={e=>setFilterDivision(e.target.value)} className="border px-3 py-2 rounded">
          <option value="">All Divisions</option>
          {divisions.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
        </select>

        <select value={filterDepartment} onChange={e=>setFilterDepartment(e.target.value)} className="border px-3 py-2 rounded">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
        </select>

        <select value={supervisorCode} onChange={e=>setSupervisorCode(e.target.value)} className="border px-3 py-2 rounded">
          <option value="">Supervisor (quick assign)</option>
          {supervisors.map(s => <option key={s.code} value={s.code}>{s.name} — {s.code}</option>)}
        </select>

        <a href="/api/employees/export" className="px-3 py-2 border rounded text-sm">Export CSV</a>
      </div>

      <section className="bg-white p-4 rounded shadow mb-6">
        <form onSubmit={submitForm} className="grid grid-cols-3 gap-3">
          <div><label>Code *</label><input value={code} onChange={e=>setCode(e.target.value)} className="border px-3 py-2 rounded w-full" disabled={isEdit} /></div>
          <div><label>Name *</label><input value={name} onChange={e=>setName(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>
          <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>

          <div><label>Mobile</label><input value={mobile} onChange={e=>setMobile(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>
          <div><label>Aadhar</label><input value={aadhar} onChange={e=>setAadhar(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>
          <div><label>PF / TF</label><input value={pfNumber} onChange={e=>setPfNumber(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>

          <div><label>ESIC</label><input value={esicNumber} onChange={e=>setEsicNumber(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>
          <div><label>Bank Account</label><input value={bankAccount} onChange={e=>setBankAccount(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>
          <div><label>IFSC</label><input value={ifsc} onChange={e=>setIfsc(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>

          <div><label>Address</label><input value={address} onChange={e=>setAddress(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>
          <div><label>Zone</label><select value={zone} onChange={e=>setZone(e.target.value)} className="border px-3 py-2 rounded w-full"><option value="">—</option>{zones.map(z=> <option key={z._id} value={z.name}>{z.name}</option>)}</select></div>
          <div><label>Division</label><select value={division} onChange={e=>setDivision(e.target.value)} className="border px-3 py-2 rounded w-full"><option value="">—</option>{divisions.map(d=> <option key={d._id} value={d.name}>{d.name}</option>)}</select></div>

          <div><label>Department</label><select value={department} onChange={e=>setDepartment(e.target.value)} className="border px-3 py-2 rounded w-full"><option value="">—</option>{departments.map(d=> <option key={d._id} value={d.name}>{d.name}</option>)}</select></div>
          <div><label>Category</label><input value={category} onChange={e=>setCategory(e.target.value)} className="border px-3 py-2 rounded w-full" /></div>
          <div><label>Supervisor</label><select value={supervisorCode} onChange={e=>setSupervisorCode(e.target.value)} className="border px-3 py-2 rounded w-full"><option value="">—</option>{supervisors.map(s=> <option key={s.code} value={s.code}>{s.name} — {s.code}</option>)}</select></div>

          <div className="col-span-3">
            <label>Documents</label>
            <div className="flex gap-2 items-center mb-2">
              <input type="file" id="docA" style={{display:'none'}} onChange={(e)=>handleFileInput(e,'aadhar')} />
              <button type="button" onClick={()=>document.getElementById('docA').click()} className="px-3 py-1 border rounded">Upload Aadhaar</button>

              <input type="file" id="docP" style={{display:'none'}} onChange={(e)=>handleFileInput(e,'pan')} />
              <button type="button" onClick={()=>document.getElementById('docP').click()} className="px-3 py-1 border rounded">Upload PAN</button>

              <input type="file" id="docB" style={{display:'none'}} onChange={(e)=>handleFileInput(e,'bank_passbook')} />
              <button type="button" onClick={()=>document.getElementById('docB').click()} className="px-3 py-1 border rounded">Upload Bank</button>

              <input type="file" id="docF" style={{display:'none'}} onChange={(e)=>handleFileInput(e,'family_aadhar')} />
              <button type="button" onClick={()=>document.getElementById('docF').click()} className="px-3 py-1 border rounded">Upload Family Aadhaar</button>
            </div>

            <div>
              {documents.length===0 ? <div className="text-slate-500">No documents uploaded</div> : (
                <div className="flex gap-2 flex-wrap">
                  {documents.map((d,idx)=>(
                    <div key={idx} className="border p-2 rounded text-sm">
                      <div><strong>{d.type}</strong></div>
                      <div className="truncate" style={{maxWidth:200}}><a href={d.url} target="_blank" rel="noreferrer">{d.url}</a></div>
                      <div><button type="button" onClick={()=>removeDocument(idx)} className="text-red-600 text-xs mt-1">Remove</button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3 flex gap-2 mt-2">
            <button className="px-4 py-2 bg-sky-700 text-white rounded">{isEdit ? "Update Employee" : "Create Employee"}</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded">Reset</button>
            {isEdit && <button type="button" onClick={()=>{ setIsEdit(false); setEditingId(null); resetForm(); }} className="px-4 py-2 border rounded">Cancel</button>}
          </div>
        </form>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Employees ({filteredEmployees.length})</h2>
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="px-3 py-1 border rounded text-sm">{selectAll ? "Unselect All" : "Select All"}</button>
            <button onClick={bulkAssignToSupervisor} className="px-3 py-1 bg-purple-700 text-white rounded text-sm">Bulk Assign</button>
            <button onClick={()=>{ document.getElementById('csvFile')?.click(); }} className="px-3 py-1 border rounded text-sm">Bulk Upload CSV</button>
            <input id="csvFile" type="file" accept=".csv" style={{display:'none'}} onChange={async (e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = async ()=>{ try { const base = reader.result; const res = await fetch('/api/employees/bulk-upload',{ method:'POST', headers:{"Content-Type":"application/json"}, body: JSON.stringify({ filename: f.name, data: base }) }); const j = await res.json(); alert(j.success ? 'Bulk upload done. Created/Updated: '+(j.created?.length||j.created?.length===0? (j.created.length): '') : 'Bulk upload error: '+(j.error||'unknown')); await loadAll(); } catch(err){ alert('Bulk upload failed: '+err.message); } }; reader.readAsDataURL(f); }} />
            <button onClick={loadAll} className="px-3 py-1 border rounded text-sm">Refresh</button>
            <a href="/api/employees/export" className="px-3 py-1 border rounded text-sm">Export CSV</a>
          </div>
        </div>

        {loading ? <div>Loading...</div> : filteredEmployees.length===0 ? <div className="text-slate-500">No employees</div> : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr>
                <th className="p-2 w-10">Sel</th>
                <th className="p-2">Code</th>
                <th className="p2">Name</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Division</th>
                <th className="p-2">Supervisor</th>
                <th className="p-2">Docs</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp._id} className="border-t">
                  <td className="p-2"><input type="checkbox" checked={!!selected[emp.code]} onChange={()=>toggleSelect(emp.code)} /></td>
                  <td className="p-2 font-medium">{emp.code}</td>
                  <td className="p-2">{emp.name}</td>
                  <td className="p-2">{emp.mobile||'-'}</td>
                  <td className="p-2">{emp.zone||'-'}</td>
                  <td className="p-2">{emp.division||'-'}</td>
                  <td className="p-2">{emp.supervisorCode||'-'}</td>
                  <td className="p-2">{ (emp.documents&&emp.documents.length)? emp.documents.map((d,i)=><div key={i}><a href={d.url} target="_blank" rel="noreferrer" className="text-xs">{d.type}</a></div>) : '-' }</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={()=>openEdit(emp)} className="px-2 py-1 bg-yellow-500 text-white rounded text-xs">Edit</button>
                    <button onClick={()=>deleteEmployee(emp)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
                    <button onClick={()=>assignSingle(emp)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

