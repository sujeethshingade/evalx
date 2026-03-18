import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../../lib/server-auth";
import SavedResult from "../../../../../models/SavedResult";
import {
  getScore,
  getStudentName,
  getStudentUsn,
  isPassing,
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
    const runs = await SavedResult.find({ userId: authUser.id })
      .sort({ createdAt: -1 })
      .select("_id semester createdAt resultsData")
      .lean();

    const semesterRecords: SemesterStudentRecord[] = [];
    let studentName = "Unknown";

    for (const run of runs) {
      const rows = Array.isArray(run.resultsData)
        ? (run.resultsData as RawResultRow[])
        : [];

      const matchedRow = rows.find((row) => getStudentUsn(row) === targetUsn);
      if (!matchedRow) {
        continue;
      }

      studentName = getStudentName(matchedRow) || studentName;
      semesterRecords.push({
        semester: run.semester,
        runId: String(run._id),
        runCreatedAt: new Date(run.createdAt).toISOString(),
        usn: targetUsn,
        name: studentName,
        subjects: parseSubjects(matchedRow),
      });
    }

    if (semesterRecords.length === 0) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    semesterRecords.sort((a, b) =>
      b.runCreatedAt.localeCompare(a.runCreatedAt),
    );

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
