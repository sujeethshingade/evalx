import { cookies } from "next/headers";
import { verifyJwt } from "./auth";

export type AuthPayload = {
  id: string;
  email: string;
};

export async function getAuthenticatedUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    cookieStore.delete("auth-token");
    return null;
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  const email = typeof payload.email === "string" ? payload.email : "";

  if (!id || !email) {
    return null;
  }

  return { id, email };
}
