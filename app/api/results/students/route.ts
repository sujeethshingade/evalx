import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "../../../../lib/mongodb";
import { getAuthenticatedUser } from "../../../../lib/server-auth";
import SavedResult from "../../../../models/SavedResult";
import {
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
    const userId = new Types.ObjectId(authUser.id);

    // Unwind rows in MongoDB and normalize USN/Name in TS using shared helpers.
    const rows = await SavedResult.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $unwind: "$resultsData" },
      {
        $project: {
          createdAt: 1,
          row: "$resultsData",
        },
      },
    ]).exec();

    const byUsn = new Map<string, StudentListItem>();
    for (const entry of rows as Array<{
      createdAt: Date | string;
      row: RawResultRow;
    }>) {
      const usn = getStudentUsn(entry.row);
      if (!usn || usn === "NOT_FOUND") {
        continue;
      }

      // Since rows are sorted by createdAt desc, first hit per USN is latest.
      if (!byUsn.has(usn)) {
        byUsn.set(usn, {
          usn,
          name: getStudentName(entry.row) || "Unknown",
          latestRunAt: new Date(entry.createdAt).toISOString(),
        });
      }
    }

    const students = [...byUsn.values()].sort((a, b) =>
      a.usn.localeCompare(b.usn),
    );

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    console.error("Students list error:", error);
    return NextResponse.json(
      { message: "Failed to fetch students" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
