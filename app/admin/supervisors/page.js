"use client";

import { useEffect, useMemo, useState } from "react";

function toISODateOnly(val) {
  if (!val) return "";
  try {
    const s = String(val);
    if (s.length >= 10) return s.slice(0, 10);
    return "";
  } catch {
    return "";
  }
}

function yearsBetween(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  let years = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && b.getDate() < a.getDate())) years -= 1;
  return years;
}

function addYears(dateStr, years) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export default function AdminSupervisorsPage() {
  const [loading, setLoading] = useState(true);

  const [list, setList] = useState([]);

  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [editingCode, setEditingCode] = useState(null);
  const [viewingSupervisor, setViewingSupervisor] = useState(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [doj, setDoj] = useState("");

  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");
  const [pfNumber, setPfNumber] = useState("");
  const [esicNumber, setEsicNumber] = useState("");

  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  const [zoneId, setZoneId] = useState("");
  const [divisionIds, setDivisionIds] = useState([]);
  const [department, setDepartment] = useState("");

  const [documents, setDocuments] = useState([
    { name: "", file: null, url: "", originalName: "" },
  ]);

  const zoneMap = useMemo(() => {
    const m = new Map();
    (zones || []).forEach((z) => m.set(String(z._id), z.name));
    return m;
  }, [zones]);

  const divisionMap = useMemo(() => {
    const m = new Map();
    (divisions || []).forEach((d) => m.set(String(d._id), d.name));
    return m;
  }, [divisions]);

  const divisionsForZone = useMemo(() => {
    if (!zoneId) return [];
    return (divisions || []).filter((d) => String(d.zoneId) === String(zoneId));
  }, [zoneId, divisions]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, z, d, dept] = await Promise.all([
        fetch("/api/supervisors/list").then((r) => r.json()),
        fetch("/api/zones/list").then((r) => r.json()),
        fetch("/api/divisions/list").then((r) => r.json()),
        fetch("/api/departments/list").then((r) => r.json()),
      ]);

      setList(s.supervisors || []);
      setZones(z.zones || []);
      setDivisions(d.divisions || []);
      setDepartments(dept.departments || []);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingCode(null);

    setCode("");
    setName("");
    setMobile("");
    setEmail("");
    setPassword("");

    setGender("");
    setAddress("");
    setDob("");
    setDoj("");

    setAadhar("");
    setPan("");
    setPfNumber("");
    setEsicNumber("");

    setBankAccount("");
    setIfsc("");
    setBankBranch("");

    setZoneId("");
    setDivisionIds([]);
    setDepartment("");

    setDocuments([{ name: "", file: null, url: "", originalName: "" }]);
  }

  function normalizeGender(val) {
    const v = String(val || "").trim().toLowerCase();
    if (v === "male" || v === "female" || v === "other") return v;
    if (v === "m") return "male";
    if (v === "f") return "female";
    return "";
  }

  function validateDOBandDOJ(dobVal, dojVal) {
    if (!dobVal) return { ok: true };
    const age = yearsBetween(dobVal, new Date().toISOString().slice(0, 10));
    if (age < 18) {
      return { ok: false, msg: "DOB must be 18+ years." };
    }
    if (dojVal) {
      const minDoj = addYears(dobVal, 18);
      if (dojVal < minDoj) {
        return { ok: false, msg: `DOJ must be on/after ${minDoj} (DOB + 18 years).` };
      }
    }
    return { ok: true };
  }

  function toggleDivision(id) {
    const sid = String(id);
    setDivisionIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));
  }

  function setDocField(index, field, value) {
    setDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  function addDocRow() {
    setDocuments((prev) => [...prev, { name: "", file: null, url: "", originalName: "" }]);
  }

  function removeDocRow(index) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadDoc(index) {
    const d = documents[index];
    if (!d?.name?.trim()) return alert("Enter document name.");
    if (!d?.file) return alert("Choose a file.");

    const fd = new FormData();
    fd.append("file", d.file);
    fd.append("name", d.name.trim());

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json();

    if (!res.ok) {
      alert(j?.error || "Upload failed");
      return;
    }

    setDocuments((prev) =>
      prev.map((x, i) =>
        i === index
          ? { ...x, url: j.url || "", originalName: j.originalName || x.file?.name || "" }
          : x
      )
    );
  }

  function getZoneNameFromSupervisor(s) {
    if (s.zoneName) return s.zoneName;
    const z = s.zoneId || s.zone;
    if (!z) return "—";
    const zs = String(z);
    if (zs.length < 30 && !zs.match(/^[0-9a-f]{24}$/i)) return zs;
    return zoneMap.get(zs) || "—";
  }

  function getDivisionNamesFromSupervisor(s) {
    if (Array.isArray(s.divisionNames) && s.divisionNames.length) return s.divisionNames;

    const divs = Array.isArray(s.divisions) ? s.divisions : s.division ? [s.division] : [];
    if (!divs.length) return [];

    const names = divs
      .map((x) => {
        const v = String(x);
        if (v.length < 30 && !v.match(/^[0-9a-f]{24}$/i)) return v;
        return divisionMap.get(v) || "";
      })
      .filter(Boolean);

    return names;
  }

  function startEditSupervisor(s) {
    setEditingCode(s.code);

    setCode(s.code || "");
    setName(s.name || "");
    setMobile(s.mobile || "");
    setEmail(s.email || "");
    setPassword("");

    setGender(normalizeGender(s.gender));
    setAddress(s.address || "");
    setDob(toISODateOnly(s.dob));
    setDoj(toISODateOnly(s.doj));

    setAadhar(s.aadhar || "");
    setPan(s.pan || "");
    setPfNumber(s.pfNumber || "");
    setEsicNumber(s.esicNumber || "");

    setBankAccount(s.bankAccount || "");
    setIfsc(s.ifsc || "");
    setBankBranch(s.bankBranch || "");

    const zid = s.zoneId || s.zone || "";
    setZoneId(zid ? String(zid) : "");

    const divRaw = Array.isArray(s.divisions) ? s.divisions : s.division ? [s.division] : [];
    const divIdsNorm = divRaw.map((x) => String(x));
    setDivisionIds(divIdsNorm);

    setDepartment(s.department || "");

    if (Array.isArray(s.documents) && s.documents.length > 0) {
      setDocuments(
        s.documents.map((d) => ({
          name: d.name || d.type || "Document",
          file: null,
          url: d.url || "",
          originalName: d.originalName || "",
        }))
      );
    } else {
      setDocuments([{ name: "", file: null, url: "", originalName: "" }]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteSupervisor(codeVal) {
    if (!confirm(`Delete supervisor ${codeVal}?`)) return;
    const res = await fetch("/api/supervisors/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeVal }),
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j?.error || "Delete failed");
      return;
    }
    loadAll();
  }

  function assignEmployee(codeVal) {
    alert(`Assign clicked for ${codeVal}`);
  }

  async function submitSupervisor(e) {
    e.preventDefault();

    if (!code.trim()) return alert("Code is required.");
    if (!name.trim()) return alert("Name is required.");
    if (!mobile.trim()) return alert("Mobile is required.");

    if (!editingCode && !password) return alert("Password is required for create.");

    const g = normalizeGender(gender);
    if (gender && !g) return alert("Gender must be Male/Female/Other.");

    const v = validateDOBandDOJ(dob, doj);
    if (!v.ok) return alert(v.msg);

    const pending = documents.some((d) => d?.file && !d?.url);
    if (pending) return alert("Please upload selected documents first.");

    const docsPayload = (documents || [])
      .filter((d) => d?.name?.trim() && d?.url)
      .map((d) => ({
        name: d.name.trim(),
        url: d.url,
        originalName: d.originalName || "",
      }));

    const payload = {
      code: code.trim(),
      name: name.trim(),
      mobile: mobile.trim(),
      email: email?.trim() || null,

      gender: g || null,
      address: address?.trim() || null,
      dob: dob || null,
      doj: doj || null,

      aadhar: aadhar?.trim() || null,
      pan: pan?.trim() || null,
      pfNumber: pfNumber?.trim() || null,
      esicNumber: esicNumber?.trim() || null,

      bankAccount: bankAccount?.trim() || null,
      ifsc: ifsc?.trim() || null,
      bankBranch: bankBranch?.trim() || null,

      zone: zoneId || null,
      divisions: divisionIds,
      department: department || null,

      documents: docsPayload,
    };

    if (!editingCode) payload.password = password;

    const endpoint = editingCode ? "/api/supervisors/update" : "/api/supervisors/create";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await res.json();
    if (!res.ok) {
      alert(j?.error || "Save failed");
      return;
    }

    alert(editingCode ? "Supervisor updated!" : "Supervisor created!");
    resetForm();
    loadAll();
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Supervisors</h1>

      {viewingSupervisor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[95%] max-w-4xl rounded shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Supervisor Details (View)</h2>
              <button
                type="button"
                className="px-3 py-1 border rounded"
                onClick={() => setViewingSupervisor(null)}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Code:</b> {viewingSupervisor.code || "—"}</div>
              <div><b>Name:</b> {viewingSupervisor.name || "—"}</div>
              <div><b>Mobile:</b> {viewingSupervisor.mobile || "—"}</div>
              <div><b>Email:</b> {viewingSupervisor.email || "—"}</div>

              <div><b>Gender:</b> {viewingSupervisor.gender || "—"}</div>
              <div><b>Department:</b> {viewingSupervisor.department || "—"}</div>

              <div className="col-span-2"><b>Address:</b> {viewingSupervisor.address || "—"}</div>

              <div><b>DOB:</b> {viewingSupervisor.dob ? toISODateOnly(viewingSupervisor.dob) : "—"}</div>
              <div><b>DOJ:</b> {viewingSupervisor.doj ? toISODateOnly(viewingSupervisor.doj) : "—"}</div>

              <div><b>Aadhaar:</b> {viewingSupervisor.aadhar || "—"}</div>
              <div><b>PAN:</b> {viewingSupervisor.pan || "—"}</div>
              <div><b>PF:</b> {viewingSupervisor.pfNumber || "—"}</div>
              <div><b>ESIC:</b> {viewingSupervisor.esicNumber || "—"}</div>

              <div><b>Bank A/c:</b> {viewingSupervisor.bankAccount || "—"}</div>
              <div><b>IFSC:</b> {viewingSupervisor.ifsc || "—"}</div>
              <div><b>Branch:</b> {viewingSupervisor.bankBranch || "—"}</div>

              <div><b>Zone:</b> {getZoneNameFromSupervisor(viewingSupervisor)}</div>
              <div>
                <b>Divisions:</b>{" "}
                {getDivisionNamesFromSupervisor(viewingSupervisor).length
                  ? getDivisionNamesFromSupervisor(viewingSupervisor).join(", ")
                  : "—"}
              </div>

              <div className="col-span-2">
                <b>Documents:</b>
                <div className="mt-1 space-y-1">
                  {Array.isArray(viewingSupervisor.documents) && viewingSupervisor.documents.length ? (
                    viewingSupervisor.documents.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span>{d.name || d.type || "Document"}</span>
                        {d.url ? (
                          <a className="text-blue-700 underline" href={d.url} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">No documents</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {editingCode ? `Edit Supervisor (${editingCode})` : "Create Supervisor"}
          </h2>
          <div className="flex gap-2">
            {editingCode && (
              <button type="button" className="px-3 py-1 border rounded" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
            <button type="button" className="px-3 py-1 border rounded" onClick={loadAll}>
              Refresh
            </button>
          </div>
        </div>

        <form onSubmit={submitSupervisor} className="grid grid-cols-3 gap-3">
          <div>
            <label>Code *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border px-2 py-2 w-full rounded"
              disabled={!!editingCode}
            />
          </div>

          <div>
            <label>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>Mobile *</label>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>Password {editingCode ? "(keep blank to keep same)" : "*"}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="border px-2 py-2 w-full rounded">
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="col-span-3">
            <label>Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="border px-2 py-2 w-full rounded" rows={2} />
          </div>

          <div>
            <label>DOB (18+)</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => {
                const v = e.target.value;
                setDob(v);
                const check = validateDOBandDOJ(v, doj);
                if (!check.ok) {
                  setDoj("");
                }
              }}
              className="border px-2 py-2 w-full rounded"
            />
          </div>

          <div>
            <label>DOJ</label>
            <input
              type="date"
              value={doj}
              onChange={(e) => setDoj(e.target.value)}
              className="border px-2 py-2 w-full rounded"
              min={dob ? addYears(dob, 18) : undefined}
            />
          </div>

          <div>
            <label>Aadhaar</label>
            <input value={aadhar} onChange={(e) => setAadhar(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>PAN</label>
            <input value={pan} onChange={(e) => setPan(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>PF Number</label>
            <input value={pfNumber} onChange={(e) => setPfNumber(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>ESIC Number</label>
            <input value={esicNumber} onChange={(e) => setEsicNumber(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>Bank Account</label>
            <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>IFSC</label>
            <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>Bank Branch</label>
            <input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} className="border px-2 py-2 w-full rounded" />
          </div>

          <div>
            <label>Zone</label>
            <select value={zoneId} onChange={(e) => { setZoneId(e.target.value); setDivisionIds([]); }} className="border px-2 py-2 w-full rounded">
              <option value="">—</option>
              {zones.map((z) => (
                <option key={z._id} value={z._id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label>Divisions (Multiple)</label>
            <div className="border rounded p-2 max-h-32 overflow-auto">
              {!zoneId ? (
                <div className="text-slate-500 text-sm">Select zone first</div>
              ) : divisionsForZone.length === 0 ? (
                <div className="text-slate-500 text-sm">No divisions for this zone</div>
              ) : (
                divisionsForZone.map((d) => {
                  const id = String(d._id);
                  const checked = divisionIds.includes(id);
                  return (
                    <label key={id} className="flex items-center gap-2 text-sm py-1">
                      <input type="checkbox" checked={checked} onChange={() => toggleDivision(id)} />
                      <span>{d.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="col-span-3">
            <label>Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="border px-2 py-2 w-full rounded">
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-3">
            <label className="text-sm font-medium">Documents (Name + Upload + Preview)</label>

            <div className="mt-2 space-y-2">
              {documents.map((d, idx) => (
                <div key={idx} className="border rounded p-2">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input
                        placeholder="Document Name (e.g. Aadhaar Front)"
                        value={d.name}
                        onChange={(e) => setDocField(idx, "name", e.target.value)}
                        className="border rounded px-2 py-2 w-full"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="file"
                        onChange={(e) => setDocField(idx, "file", e.target.files?.[0] || null)}
                        className="border rounded px-2 py-2 w-full"
                      />
                    </div>

                    <div className="col-span-2">
                      <button type="button" onClick={() => uploadDoc(idx)} className="w-full px-3 py-2 bg-sky-700 text-white text-sm rounded">
                        Upload
                      </button>
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button type="button" onClick={() => removeDocRow(idx)} className="px-3 py-2 text-red-600 border rounded text-sm">
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    {d.url ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700">Uploaded: {d.originalName || "file"}</span>
                        <a className="text-blue-700 underline" href={d.url} target="_blank" rel="noreferrer">View</a>
                      </div>
                    ) : (
                      <span className="text-slate-500">Not uploaded yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addDocRow} className="mt-2 px-3 py-2 bg-slate-900 text-white text-sm rounded">
              Add More Document
            </button>
          </div>

          <div className="col-span-3 flex gap-3 mt-4">
            <button className="px-4 py-2 bg-sky-700 text-white rounded" type="submit">
              {editingCode ? "Update Supervisor" : "Create Supervisor"}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded">
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Supervisors List</h2>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 border-b">
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Divisions</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {list.map((s) => {
                const zoneName = getZoneNameFromSupervisor(s);
                const divNames = getDivisionNamesFromSupervisor(s);
                return (
                  <tr key={s.code} className="border-b">
                    <td className="p-2">{s.code}</td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.mobile}</td>
                    <td className="p-2">{zoneName}</td>
                    <td className="p-2">{divNames.length ? divNames.join(", ") : "—"}</td>

                    <td className="p-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingSupervisor(s)}
                        className="px-2 py-1 bg-slate-700 text-white rounded text-xs"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditSupervisor(s)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSupervisor(s.code)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                      >
                        Delete
                      </button>

                      <button
                        type="button"
                        onClick={() => assignEmployee(s.code)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

