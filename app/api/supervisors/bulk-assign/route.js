// app/api/supervisors/bulk-assign/route.js
import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";
import Supervisor from "../../../../models/Supervisor";

export async function POST(req) {
  try {
    await dbConnect();
    const { supervisorCode, employeeCodes } = await req.json();

    if (!supervisorCode || !Array.isArray(employeeCodes) || employeeCodes.length === 0) {
      return new Response(JSON.stringify({ success:false, error:"supervisorCode and employeeCodes[] required" }), {
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

    const result = await Employee.updateMany(
      { code: { $in: employeeCodes } },
      { supervisorCode }
    );

    return new Response(JSON.stringify({ 
      success:true, 
      updatedCount: result.modifiedCount 
    }), {
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

