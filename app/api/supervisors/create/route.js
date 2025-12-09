// app/api/supervisors/create/route.js
import dbConnect from "../../../../lib/mongodb";
import Supervisor from "../../../../models/Supervisor";
import bcrypt from "bcryptjs";

/**
 * Creates a supervisor with extended profile fields.
 * Accepts (in JSON body):
 *  - code, name, password (required)
 *  - email, mobile, gender, address, dob, doj
 *  - aadhar, pan, pfNumber, esicNumber
 *  - bankAccount, ifsc, bankBranch
 *  - zone, division, department
 *  - documents (array of { type, filename, url })  // optional metadata only
 *
 * Returns supervisor without passwordHash.
 */

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      code,
      name,
      email,
      mobile,
      password,
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
      division,
      department,
      documents,
    } = body || {};

    if (!code || !name || !password || !mobile) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: code, name, mobile, password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await dbConnect();

    // check duplicate code
    const existing = await Supervisor.findOne({ code }).lean();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: "Supervisor code already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const sup = await Supervisor.create({
      code,
      name,
      email: email || null,
      mobile,
      gender: gender || null,
      address: address || null,
      dob: dob ? new Date(dob) : null,
      doj: doj ? new Date(doj) : null,
      aadhar: aadhar || null,
      pan: pan || null,
      pfNumber: pfNumber || null,
      esicNumber: esicNumber || null,
      bankAccount: bankAccount || null,
      ifsc: ifsc || null,
      bankBranch: bankBranch || null,
      zone: zone || null,
      division: division || null,
      department: department || null,
      documents: Array.isArray(documents) ? documents : [],
      faceDescriptor: [],
      passwordHash,
    });

    // remove sensitive fields before returning
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
      division: sup.division,
      department: sup.department,
      documents: sup.documents || [],
      createdAt: sup.createdAt,
    };

    return new Response(JSON.stringify({ success: true, supervisor: out }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create supervisor error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

