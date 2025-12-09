import dbConnect from "../../../../lib/mongodb";
import Zone from "../../../../models/Zone";

export async function POST(req) {
  try {
    await dbConnect();
    const { name } = await req.json();

    if (!name) {
      return Response.json({ success: false, error: "Zone name required" }, { status: 400 });
    }

    const zone = await Zone.create({ name });

    return Response.json({ success: true, zone }, { status: 201 });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

