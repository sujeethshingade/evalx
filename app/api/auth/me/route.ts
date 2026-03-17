import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "../../../../lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    cookieStore.delete("auth-token");
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json(
    {
      authenticated: true,
      email: payload.email,
    },
    { status: 200 },
  );
}
