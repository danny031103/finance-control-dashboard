import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Comment route — Phase 5" });
}
