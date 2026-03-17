import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { signJwt } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email already verified. Please log in with password." },
        { status: 400 },
      );
    }

    if (user.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Mark as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Create JWT
    const token = await signJwt({
      email: user.email,
      id: user._id.toString(),
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return NextResponse.json(
      { message: "Email verified and login successful" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
