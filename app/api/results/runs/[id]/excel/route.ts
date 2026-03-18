import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../../../lib/server-auth";
import SavedResult from "../../../../../../models/SavedResult";

type Params = {
  id: string;
};

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await connectToDatabase();

    const run = await SavedResult.findOne({ _id: id, userId: authUser.id })
      .select("excelData excelFileName excelFileUrl")
      .lean();

    if (!run) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (run.excelFileUrl) {
      return NextResponse.redirect(run.excelFileUrl);
    }

    if (!run.excelData) {
      return NextResponse.json(
        { message: "No excel data found for this run." },
        { status: 404 },
      );
    }

    return new NextResponse(new Uint8Array(run.excelData), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${run.excelFileName}"`,
      },
    });
  } catch (error) {
    console.error("Download excel error:", error);
    return NextResponse.json(
      { message: "Failed to download saved excel" },
      { status: 500 },
    );
  }
}
