import { NextResponse } from "next/server";
import { listCategories } from "@/server/store/categories";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json({ categories });
}
