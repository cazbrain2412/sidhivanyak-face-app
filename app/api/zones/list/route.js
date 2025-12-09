import dbConnect from "../../../../lib/mongodb";
import Zone from "../../../../models/Zone";

export async function GET() {
  try {
    await dbConnect();
    const zones = await Zone.find().sort({ createdAt: -1 });

    return Response.json({ success: true, zones });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

