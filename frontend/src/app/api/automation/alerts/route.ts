import { NextResponse } from "next/server";
import { evaluateAlerts } from "@/server/store/automation";

export async function GET() {
  const alerts = await evaluateAlerts();
  return NextResponse.json({ alerts });
}
