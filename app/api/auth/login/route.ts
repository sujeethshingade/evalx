import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { signJwt } from "../../../../lib/auth";
import { Resend } from "resend";
import { getEmailFromAddress, otpTemplate } from "../../../../lib/email";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const { error } = await resend.emails.send({
        from: getEmailFromAddress(),
        to: normalizedEmail,
        subject: "Verify your EvalX account",
        html: otpTemplate(otp),
      });

      if (error) {
        console.error("Login verification OTP send error:", error);
        return NextResponse.json(
          { message: "Failed to send verification email" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          message: "Please verify your email with OTP before logging in.",
          needsVerification: true,
        },
        { status: 403 },
      );
    }

    const token = await signJwt({ email: user.email, id: user._id.toString() });
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ message: "Login successful" }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
