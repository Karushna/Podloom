import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { getPublishHistory } from "@/lib/db";

export async function GET() {
  const userId = await getOrCreateUserId();
  const history = getPublishHistory(userId);
  return NextResponse.json({ history });
}
