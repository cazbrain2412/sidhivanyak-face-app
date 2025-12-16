import dbConnect from "../../../../lib/mongodb";
import Employee from "../../../../models/Employee";
import Zone from "../../../../models/Zone";

export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const zoneId = url.searchParams.get("zone");

    let query = {};

    if (zoneId && zoneId !== "ALL") {
      const zoneDoc = await Zone.findById(zoneId).select("name").lean();
      if (zoneDoc) {
        query.zone = zoneDoc.name; // match STRING
      }
    }

    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return new Response(
      JSON.stringify({ success: true, employees }),
      { status: 200 }
    );
  } catch (err) {
    console.error("employees list error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

