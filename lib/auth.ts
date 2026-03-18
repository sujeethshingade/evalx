import { jwtVerify, SignJWT } from "jose";

export const getJwtSecretKey = () => {
  const secret =
    process.env.JWT_SECRET || "evalx-fallback-secret-development-key-only";
  if (!secret || secret.length === 0) {
    throw new Error("The environment variable JWT_SECRET is not set.");
  }
  return secret;
};

export const signJwt = async (payload: { email: string; id: string }) => {
  const secret = new TextEncoder().encode(getJwtSecretKey());
  const alg = "HS256";

  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("30d") // session lasts 30 days
    .sign(secret);
};

export const verifyJwt = async (token: string) => {
  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
};
