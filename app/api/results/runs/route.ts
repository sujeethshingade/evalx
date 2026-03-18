import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import connectToDatabase from "../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../lib/server-auth";
import SavedResult from "../../../../models/SavedResult";
import type { RawResultRow } from "../../../../lib/results";

function sanitizeSemester(semester: unknown): string {
  if (typeof semester !== "string") {
    return "Unknown";
  }
  return semester.trim() || "Unknown";
}

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const runs = await SavedResult.find({ userId: authUser.id })
      .sort({ createdAt: -1 })
      .select("_id semester totalStudents excelFileName createdAt")
      .lean();

    return NextResponse.json({ runs }, { status: 200 });
  } catch (error) {
    console.error("List runs error:", error);
    return NextResponse.json(
      { message: "Failed to fetch saved results" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const semester = sanitizeSemester(body.semester);
    const rawResults = Array.isArray(body.results)
      ? (body.results as RawResultRow[])
      : [];

    if (rawResults.length === 0) {
      return NextResponse.json(
        { message: "Results are required to save" },
        { status: 400 },
      );
    }

    const worksheet = xlsx.utils.json_to_sheet(rawResults);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Student Marks");
    const excelData = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;

    const fileName = `EvalX_Results_Sem_${semester}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    await connectToDatabase();
    const saved = await SavedResult.create({
      userId: authUser.id,
      semester,
      totalStudents: rawResults.length,
      resultsData: rawResults,
      excelData,
      excelFileName: fileName,
    });

    return NextResponse.json(
      {
        message: "Saved successfully",
        run: {
          id: saved._id,
          semester: saved.semester,
          totalStudents: saved.totalStudents,
          excelFileName: saved.excelFileName,
          createdAt: saved.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Save run error:", error);
    return NextResponse.json(
      { message: "Failed to save extracted data" },
      { status: 500 },
    );
  }
}
