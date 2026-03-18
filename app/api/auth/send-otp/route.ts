import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../models/User";
import {
  getEmailFromAddress,
  getResendClient,
  otpTemplate,
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

    const body = await req.json();
    const { email } = body;
    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Generate 6 digit OTP for email verification only
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { message: "Account not found. Please sign up first." },
        { status: 404 },
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email is already verified. Please log in with password." },
        { status: 400 },
      );
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const { error } = await resend.emails.send({
      from: getEmailFromAddress(),
      to: normalizedEmail,
      subject: "Verify your EvalX account",
      html: otpTemplate(otp),
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json(
        { message: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Verification OTP sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
