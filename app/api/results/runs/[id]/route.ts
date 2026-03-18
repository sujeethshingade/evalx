import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../../lib/server-auth";
import SavedResult from "../../../../../models/SavedResult";

type Params = {
  id: string;
};

export async function GET(req: Request, context: { params: Promise<Params> }) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const url = new URL(req.url);
    const isExcelDownload = url.searchParams.get("format") === "excel";

    await connectToDatabase();

    const run = await SavedResult.findOne({
      _id: id,
      userId: authUser.id,
    })
      .select(
        isExcelDownload
          ? "_id semester excelData excelFileName"
          : "_id semester totalStudents resultsData createdAt",
      )
      .lean();

    if (!run) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (isExcelDownload && run.excelData) {
      const bytes = Buffer.isBuffer(run.excelData)
        ? new Uint8Array(run.excelData)
        : new Uint8Array(Buffer.from(run.excelData));

      return new NextResponse(bytes, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${run.excelFileName}"`,
        },
      });
    }

    return NextResponse.json({ data: run.resultsData || [] }, { status: 200 });
  } catch (error) {
    console.error("Get run data error:", error);
    return NextResponse.json(
      { message: "Failed to fetch run data" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<Params> },
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await connectToDatabase();

    const deleted = await SavedResult.findOneAndDelete({
      _id: id,
      userId: authUser.id,
    });

    if (!deleted) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete run error:", error);
    return NextResponse.json(
      { message: "Failed to delete saved result" },
      { status: 500 },
    );
  }
}
