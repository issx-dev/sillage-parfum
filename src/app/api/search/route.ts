import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ query: q, results: [] });
  }

  const results = searchProducts(q);
  return NextResponse.json({ query: q, results });
}
