import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../lib/server-auth";
import SavedResult from "../../../../models/SavedResult";
import {
  getScore,
  getStudentName,
  getStudentUsn,
  RawResultRow,
} from "../../../../lib/results";

type StudentListItem = {
  usn: string;
  name: string;
  latestRunAt: string;
};

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const runs = await SavedResult.find({ userId: authUser.id })
      .sort({ createdAt: -1 })
      .select("_id semester createdAt resultsData")
      .lean();

    const byUsn = new Map<
      string,
      {
        name: string;
        latestRunAt: string;
      }
    >();

    for (const run of runs) {
      const rows = Array.isArray(run.resultsData)
        ? (run.resultsData as RawResultRow[])
        : [];

      for (const row of rows) {
        const usn = getStudentUsn(row);
        if (!usn) {
          continue;
        }

        const name = getStudentName(row);
        const runCreatedAt = new Date(run.createdAt).toISOString();

        if (!byUsn.has(usn)) {
          byUsn.set(usn, {
            name,
            latestRunAt: runCreatedAt,
          });
          continue;
        }

        const existing = byUsn.get(usn);
        if (!existing) {
          continue;
        }

        if (runCreatedAt > existing.latestRunAt) {
          existing.latestRunAt = runCreatedAt;
          existing.name = name || existing.name;
        }
      }
    }

    const students: StudentListItem[] = [...byUsn.entries()].map(
      ([usn, data]) => ({
        usn,
        name: data.name,
        latestRunAt: data.latestRunAt,
      }),
    );

    students.sort((a, b) => a.usn.localeCompare(b.usn));

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    console.error("Students list error:", error);
    return NextResponse.json(
      { message: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
