// app/api/supervisors/update/route.js
import dbConnect from "../../../../lib/mongodb";
import Supervisor from "../../../../models/Supervisor";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { 
  code,
  name,
  email,
  mobile,
  gender,
  address,
  dob,
  doj,
  aadhar,
  pan,
  pfNumber,
  esicNumber,
  bankAccount,
  ifsc,
  bankBranch,
  zone,
  divisions,
  department,
  documents
} = body || {};


    if (!code) {
      return new Response(JSON.stringify({ success: false, error: "Supervisor code required" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const update = {};
    if (name) update.name = name;
    if (email !== undefined) update.email = email || null;
    if (mobile !== undefined) update.mobile = mobile || null;
    if (gender !== undefined) update.gender = gender || null;
    if (address !== undefined) update.address = address || null;
    if (dob !== undefined) update.dob = dob ? new Date(dob) : null;
    if (doj !== undefined) update.doj = doj ? new Date(doj) : null;
    if (aadhar !== undefined) update.aadhar = aadhar || null;
    if (pan !== undefined) update.pan = pan || null;
    if (pfNumber !== undefined) update.pfNumber = pfNumber || null;
    if (esicNumber !== undefined) update.esicNumber = esicNumber || null;
    if (bankAccount !== undefined) update.bankAccount = bankAccount || null;
    if (ifsc !== undefined) update.ifsc = ifsc || null;
    if (bankBranch !== undefined) update.bankBranch = bankBranch || null;
    if (zone !== undefined) update.zone = zone || null;
    if (Array.isArray(divisions)) update.divisions = divisions;

    if (department !== undefined) update.department = department || null;
    if (Array.isArray(documents)) update.documents = documents;

    const sup = await Supervisor.findOneAndUpdate({ code }, update, { new: true }).lean();
    if (!sup) {
      return new Response(JSON.stringify({ success: false, error: "Supervisor not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }

    // remove sensitive fields
    const out = {
      code: sup.code,
      name: sup.name,
      email: sup.email,
      mobile: sup.mobile,
      gender: sup.gender,
      address: sup.address,
      dob: sup.dob,
      doj: sup.doj,
      aadhar: sup.aadhar,
      pan: sup.pan,
      pfNumber: sup.pfNumber,
      esicNumber: sup.esicNumber,
      bankAccount: sup.bankAccount,
      ifsc: sup.ifsc,
      bankBranch: sup.bankBranch,
      zone: sup.zone,
      divisions: sup.divisions || [],
      department: sup.department,

      
      
      documents: sup.documents || [],
      updatedAt: sup.updatedAt,
    };

    return new Response(JSON.stringify({ success: true, supervisor: out }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    console.error("supervisor update error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}

