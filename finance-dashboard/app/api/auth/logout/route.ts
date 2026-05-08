import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'));
  response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
