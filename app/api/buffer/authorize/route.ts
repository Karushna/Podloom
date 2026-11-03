import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const userId = await getOrCreateUserId();
  const clientId = process.env.BUFFER_CLIENT_ID;
  const redirectUri = process.env.BUFFER_REDIRECT_URI || "http://localhost:3000/api/buffer/callback";

  if (!clientId) {
    return NextResponse.json(
      {
        error: "BUFFER_CLIENT_ID is not configured in the application environment.",
      },
      { status: 400 }
    );
  }

  // Generate random state for CSRF protection
  const state = Buffer.from(
    JSON.stringify({
      userId,
      nonce: crypto.randomBytes(16).toString("hex"),
    })
  ).toString("base64url");

  const bufferAuthUrl = new URL("https://auth.buffer.com/auth");
  bufferAuthUrl.searchParams.set("client_id", clientId);
  bufferAuthUrl.searchParams.set("redirect_uri", redirectUri);
  bufferAuthUrl.searchParams.set("response_type", "code");
  bufferAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(bufferAuthUrl.toString());
}
