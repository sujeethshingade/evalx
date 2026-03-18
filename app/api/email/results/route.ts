import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import {
  getEmailFromAddress,
  getResendClient,
  resultsTemplate,
} from "../../../../lib/email";

export async function POST(req: Request) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        {
          message:
            "Email service is not configured. Set RESEND_API_KEY in deployment environment variables.",
        },
        { status: 503 },
      );
    }

    const { emailRecipient, results, semester } = await req.json();

    if (!emailRecipient || !results || results.length === 0) {
      return NextResponse.json(
        { message: "Invalid payload." },
        { status: 400 },
      );
    }

    // 1. Generate Excel Buffer
    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Student Marks");

    // Write Excel to a Buffer and then convert to Base64 for Resend
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });
    const attachments = [
      {
        filename: `EvalX_Results_Sem${semester}_${Date.now()}.xlsx`,
        content: excelBuffer.toString("base64"),
      },
    ];

    // 2. Send email via Resend
    const { error } = await resend.emails.send({
      from: getEmailFromAddress(),
      to: [emailRecipient],
      subject: `Your EvalX Extracted Results (Semester ${semester})`,
      html: resultsTemplate(String(semester)),
      attachments: attachments,
    });

    if (error) {
      console.error("Resend Sending Error:", error);
      return NextResponse.json(
        { message: "Failed to send email." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Email sent successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Email Results Handler Error:", error);
    return NextResponse.json(
      { message: "Failed to generate or send file." },
      { status: 500 },
    );
  }
}
