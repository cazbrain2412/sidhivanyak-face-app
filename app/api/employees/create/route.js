import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const payload = {
      code: body.code,
      name: body.name,
      email: body.email || null,
      mobile: body.mobile || null,
      aadhar: body.aadhar || null,
      pfNumber: body.pfNumber || null,
      esicNumber: body.esicNumber || null,
      bankAccount: body.bankAccount || null,
      ifsc: body.ifsc || null,
      address: body.address || null,
      zone: body.zone || null,
      division: body.division || null,
      department: body.department || null,
      category: body.category || null,
      supervisorCode: body.supervisorCode || null,
      documents: Array.isArray(body.documents) ? body.documents : [],
      faceDescriptor: Array.isArray(body.faceDescriptor) ? body.faceDescriptor : []
    };

    if (!payload.code || !payload.name) {
      return new Response(JSON.stringify({ success: false, error: "code and name required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // check duplicate code
    const existing = await Employee.findOne({ code: payload.code });
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: "Employee code already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    const e = new Employee(payload);
    const saved = await e.save();

    return new Response(JSON.stringify({ success: true, employee: saved }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("employee create error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

