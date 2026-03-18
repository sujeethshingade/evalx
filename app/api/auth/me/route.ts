import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        authenticated: true,
        email: payload.email,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
