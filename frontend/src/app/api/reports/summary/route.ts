import { NextResponse } from "next/server";
import { getReportSummary } from "@/server/reports";

export async function GET() {
  const summary = await getReportSummary();
  return NextResponse.json(summary);
}
