import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.ADMIN_JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function setAdminSession(username: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encrypt({ username, expires });

  const cookieStore = await cookies();
  cookieStore.set("admin_session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", { expires: new Date(0) });
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("admin_session")?.value;
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
      name: "admin_session",
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res;
  } catch (error) {
    return;
  }
}
