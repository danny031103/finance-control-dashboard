import { NextResponse } from "next/server";
import { validatePassword, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!validatePassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    path: '/',
    maxAge: 2592000, // 30 days
  });
  return response;
}
