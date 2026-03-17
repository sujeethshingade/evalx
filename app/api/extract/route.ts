import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { message: "Expected multipart/form-data request" },
        { status: 400 },
      );
    }

    const formData = await req.formData();

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/extract`, {
      method: "POST",
      body: formData,
    });

    const textBody = await backendResponse.text();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: `Backend extract failed with status ${backendResponse.status}`,
          backendResponse: textBody,
        },
        { status: backendResponse.status },
      );
    }

    try {
      return NextResponse.json(JSON.parse(textBody), { status: 200 });
    } catch {
      return NextResponse.json(
        { message: "Backend returned invalid JSON", backendResponse: textBody },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Extract proxy error:", error);
    return NextResponse.json(
      {
        message:
          "Cannot reach extraction backend. Ensure FastAPI is running at http://127.0.0.1:8000",
      },
      { status: 502 },
    );
  }
}
