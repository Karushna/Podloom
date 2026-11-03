import { cookies, headers } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "podloom_user_id";

export async function getOrCreateUserId(): Promise<string> {
  const headerList = await headers();
  const directHeader = headerList.get("x-podloom-user-id");
  if (directHeader) {
    return directHeader;
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) {
    return existing;
  }

  const newId = `user_${crypto.randomBytes(8).toString("hex")}`;
  cookieStore.set(COOKIE_NAME, newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return newId;
}
