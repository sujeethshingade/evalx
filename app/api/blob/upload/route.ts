import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
  try {
    const { results, semester } = await req.json();

    if (!results || results.length === 0) {
      return NextResponse.json(
        { message: "No results provided for upload." },
        { status: 400 }
      );
    }

    // 1. Generate Excel Buffer
    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Student Marks");
    
    // Write to a buffer (NodeJS context)
    const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 2. Upload to Vercel Blob
    const filename = `EvalX_Results_Sem${semester}_${Date.now()}.xlsx`;
    
    // Using @vercel/blob put operation
    const blob = await put(filename, excelBuffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return NextResponse.json({ url: blob.url }, { status: 200 });

  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json(
      { message: "Failed to create or upload file." },
      { status: 500 }
    );
  }
}
