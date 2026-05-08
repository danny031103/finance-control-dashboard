import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Briefing route — Phase 7" });
}
