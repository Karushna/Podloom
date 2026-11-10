import { NextRequest, NextResponse } from "next/server";
import { setUserBufferToken } from "@/lib/db";
import { BufferClient } from "@/lib/buffer";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateStr = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Auto-detect the current host (works on Vercel preview, production, and localhost)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "podloom.vercel.app";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const detectedOrigin = `${protocol}://${host}`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || detectedOrigin;

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?buffer_error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !stateStr) {
    return NextResponse.redirect(`${baseUrl}/dashboard?buffer_error=Missing_authorization_code_or_state`);
  }

  let userId: string;
  let codeVerifier: string | undefined;
  try {
    const parsedState = JSON.parse(Buffer.from(stateStr, "base64url").toString("utf-8"));
    userId = parsedState.userId;
    codeVerifier = parsedState.codeVerifier;
  } catch {
    return NextResponse.redirect(`${baseUrl}/dashboard?buffer_error=Invalid_state_parameter`);
  }

  const clientId = process.env.BUFFER_CLIENT_ID;
  const clientSecret = process.env.BUFFER_CLIENT_SECRET;
  const redirectUri = process.env.BUFFER_REDIRECT_URI || `${baseUrl}/api/buffer/callback`;

  try {
    // Exchange authorization code for access token via Buffer OAuth Token Endpoint with PKCE
    const bodyParams = new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    if (codeVerifier) {
      bodyParams.set("code_verifier", codeVerifier);
    }

    const tokenRes = await fetch("https://auth.buffer.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Buffer token exchange failed:", errText);
      return NextResponse.redirect(
        `${baseUrl}/dashboard?buffer_error=${encodeURIComponent("Failed to exchange token with Buffer: " + errText)}`
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/dashboard?buffer_error=No_access_token_returned_by_Buffer`);
    }

    // Retrieve organization id to save with token
    let orgId: string | undefined;
    try {
      const client = new BufferClient(accessToken);
      const orgs = await client.getOrganizations();
      if (orgs.length > 0) {
        orgId = orgs[0].id;
      }
    } catch (e) {
      console.warn("Could not retrieve Buffer organization ID during callback:", e);
    }

    // Save encrypted token on server (isolated by user ID)
    setUserBufferToken(userId, accessToken, orgId, false);

    return NextResponse.redirect(`${baseUrl}/dashboard?buffer_connected=true`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`${baseUrl}/dashboard?buffer_error=${encodeURIComponent(msg)}`);
  }
}
