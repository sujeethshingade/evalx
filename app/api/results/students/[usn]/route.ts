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

    // Use aggregation pipeline to filter on server side
    const aggregationResult = await SavedResult.aggregate([
      { $match: { userId: authUser.id } },
      { $sort: { createdAt: -1 } },
      { $unwind: { path: "$resultsData", preserveNullAndEmptyArrays: false } },
      {
        $addFields: {
          "resultsData.usn": {
            $toUpper: {
              $trim: {
                input: {
                  $cond: [
                    { $isArray: ["$resultsData.usn"] },
                    { $arrayElemAt: ["$resultsData.usn", 0] },
                    "$resultsData.usn",
                  ],
                },
              },
            },
          },
        },
      },
      {
        $match: {
          "resultsData.usn": targetUsn,
        },
      },
      {
        $group: {
          _id: "$_id",
          semester: { $first: "$semester" },
          createdAt: { $first: "$createdAt" },
          resultsData: { $first: "$resultsData" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();

    if (aggregationResult.length === 0) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    const semesterRecords: SemesterStudentRecord[] = [];
    let studentName = "Unknown";

    for (const run of aggregationResult) {
      const row = run.resultsData as RawResultRow;
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
