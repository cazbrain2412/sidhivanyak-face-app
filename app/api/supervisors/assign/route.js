import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";
import Supervisor from "../../../../models/Supervisor";

export async function POST(req) {
  try {
    await dbConnect();
    const { supervisorCode, employeeCode } = await req.json();

    if (!supervisorCode || !employeeCode) {
      return new Response(JSON.stringify({ success:false, error:"Missing fields" }), {
        status:400,
        headers:{ "Content-Type":"application/json" }
      });
    }

    const supervisor = await Supervisor.findOne({ code: supervisorCode });
    if (!supervisor) {
      return new Response(JSON.stringify({ success:false, error:"Supervisor not found" }), {
        status:404,
        headers:{ "Content-Type":"application/json" }
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { code: employeeCode },
      { supervisorCode },
      { new: true }
    );

    if (!employee) {
      return new Response(JSON.stringify({ success:false, error:"Employee not found" }), {
        status:404,
        headers:{ "Content-Type":"application/json" }
      });
    }

    return new Response(JSON.stringify({ success:true, employee }), {
      status:200,
      headers:{ "Content-Type":"application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success:false, error:err.message }), {
      status:500,
      headers:{ "Content-Type":"application/json" }
    });
  }
}

