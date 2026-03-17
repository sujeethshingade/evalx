import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { Resend } from "resend";
import { getEmailFromAddress, otpTemplate } from "../../../../lib/email";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 },
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { message: "Account already exists. Please log in." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user =
      existingUser ||
      new User({
        email: normalizedEmail,
      });

    user.passwordHash = passwordHash;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.isVerified = false;
    await user.save();

    const { error } = await resend.emails.send({
      from: getEmailFromAddress(),
      to: normalizedEmail,
      subject: "Verify your EvalX account",
      html: otpTemplate(otp),
    });

    if (error) {
      console.error("Signup OTP send error:", error);
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Signup successful. Please verify your email with OTP.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
