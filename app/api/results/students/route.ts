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

    // Use aggregation pipeline to extract students server-side (faster)
    const results = await SavedResult.aggregate([
      { $match: { userId: authUser.id } },
      { $sort: { createdAt: -1 } },
      { $unwind: "$resultsData" },
      {
        $group: {
          _id: { $toUpper: "$resultsData.USN" },
          name: { $first: "$resultsData.Name" },
          latestRunAt: { $first: "$createdAt" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const students: StudentListItem[] = results
      .filter((r) => r._id && r._id !== "NOT_FOUND")
      .map((r) => ({
        usn: r._id,
        name: r.name || "Unknown",
        latestRunAt: new Date(r.latestRunAt).toISOString(),
      }));

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
