import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { getUser, getUserBufferToken, setUserBufferToken, clearUserBufferToken } from "@/lib/db";
import { BufferClient, BufferChannel } from "@/lib/buffer";

// Built-in mock channels for demonstration and sandbox testing when real Buffer is not yet connected
const DEMO_CHANNELS: BufferChannel[] = [
  {
    id: "demo_tw_1",
    name: "Podloom Podcast",
    displayName: "@podloom_show",
    service: "twitter",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    isQueuePaused: false,
  },
  {
    id: "demo_li_1",
    name: "Podloom Official Page",
    displayName: "Podloom Studio",
    service: "linkedin",
    avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop",
    isQueuePaused: false,
  },
  {
    id: "demo_th_1",
    name: "Podloom Daily",
    displayName: "@podloom",
    service: "threads",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    isQueuePaused: false,
  },
  {
    id: "demo_ig_1",
    name: "Podloom Reels & Audio",
    displayName: "podloom.clips",
    service: "instagram",
    avatar: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=100&h=100&fit=crop",
    isQueuePaused: false,
  },
];

export async function GET() {
  const userId = await getOrCreateUserId();
  const user = getUser(userId);
  const token = getUserBufferToken(userId);

  if (!token) {
    return NextResponse.json({
      connected: false,
      isMock: false,
      channels: [],
      organizations: [],
      canOAuth: Boolean(process.env.BUFFER_CLIENT_ID),
    });
  }

  // Handle mock mode
  if (user?.isMockConnection) {
    return NextResponse.json({
      connected: true,
      isMock: true,
      channels: DEMO_CHANNELS,
      organizations: [{ id: "org_demo", name: "Podloom Creator Studio (Demo)" }],
      canOAuth: Boolean(process.env.BUFFER_CLIENT_ID),
    });
  }

  // Real Buffer API call
  try {
    const client = new BufferClient(token);
    const { organizations, channels } = await client.getAllChannels();

    return NextResponse.json({
      connected: true,
      isMock: false,
      channels,
      organizations,
      canOAuth: Boolean(process.env.BUFFER_CLIENT_ID),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        connected: false,
        error: `Could not retrieve channels from Buffer: ${msg}`,
        canOAuth: Boolean(process.env.BUFFER_CLIENT_ID),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = await getOrCreateUserId();
  const body = await req.json();
  const { action, accessToken, organizationId, useDemo } = body;

  if (action === "disconnect") {
    clearUserBufferToken(userId);
    return NextResponse.json({ success: true, message: "Buffer disconnected" });
  }

  if (action === "connect_demo" || useDemo) {
    setUserBufferToken(userId, "demo_buffer_access_token", "org_demo", true);
    return NextResponse.json({
      success: true,
      message: "Connected in Demo Mode",
      channels: DEMO_CHANNELS,
    });
  }

  if (action === "connect_token") {
    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    }

    // Verify token with real Buffer API
    try {
      const client = new BufferClient(accessToken);
      const { organizations, channels } = await client.getAllChannels();
      const orgId = organizationId || (organizations.length > 0 ? organizations[0].id : undefined);

      setUserBufferToken(userId, accessToken, orgId, false);

      return NextResponse.json({
        success: true,
        message: "Buffer API connected successfully",
        organizations,
        channels,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: `Buffer authentication failed: ${msg}. Please verify your access token.`,
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
