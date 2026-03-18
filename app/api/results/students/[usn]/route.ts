import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "../../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../../lib/server-auth";
import SavedResult from "../../../../../models/SavedResult";
import {
  getStudentName,
  getStudentUsn,
  parseSubjects,
  RawResultRow,
  SemesterStudentRecord,
} from "../../../../../lib/results";

type Params = {
  usn: string;
};

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { usn } = await context.params;
    const targetUsn = decodeURIComponent(usn).toUpperCase().trim();

    await connectToDatabase();
    const userId = new Types.ObjectId(authUser.id);

    // Unwind on DB side, then use helper-based matching for mixed key support.
    const rows = await SavedResult.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $unwind: { path: "$resultsData", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 1,
          semester: 1,
          createdAt: 1,
          row: "$resultsData",
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();

    const semesterRecords: SemesterStudentRecord[] = [];
    let studentName = "Unknown";

    for (const run of rows as Array<{
      _id: unknown;
      semester: string;
      createdAt: Date | string;
      row: RawResultRow;
    }>) {
      const row = run.row;
      if (getStudentUsn(row) !== targetUsn) {
        continue;
      }

      studentName = getStudentName(row) || studentName;
      semesterRecords.push({
        semester: run.semester,
        runId: String(run._id),
        runCreatedAt: new Date(run.createdAt).toISOString(),
        usn: targetUsn,
        name: studentName,
        subjects: parseSubjects(row),
      });
    }

    if (semesterRecords.length === 0) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        student: {
          usn: targetUsn,
          name: studentName,
          semesters: semesterRecords,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Student detail error:", error);
    return NextResponse.json(
      { message: "Failed to fetch student details" },
      { status: 500 },
    );
  }
}
