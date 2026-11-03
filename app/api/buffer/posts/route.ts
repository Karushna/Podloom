import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { getUser, getUserBufferToken, recordPostPublish } from "@/lib/db";
import { BufferClient } from "@/lib/buffer";

export async function POST(req: NextRequest) {
  const userId = await getOrCreateUserId();
  const token = getUserBufferToken(userId);
  const user = getUser(userId);

  if (!token) {
    return NextResponse.json(
      { error: "No connected Buffer account. Please connect your Buffer account first." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      channelId,
      channelName,
      channelService,
      text,
      mode = "addToQueue",
      saveToDraft = true,
      episodeId,
      draftId,
    } = body;

    if (!channelId || !text) {
      return NextResponse.json(
        { error: "Both 'channelId' and 'text' are required to publish to Buffer." },
        { status: 400 }
      );
    }

    // Check if mock mode
    if (user?.isMockConnection) {
      const mockPostId = `mock_post_${Date.now()}`;
      recordPostPublish({
        id: `pub_${Date.now()}`,
        userId,
        episodeId: episodeId || "ep_sample",
        draftId: draftId || "draft_manual",
        channelId,
        channelName: channelName || channelId,
        channelService: channelService || "generic",
        mode: saveToDraft ? "saveToDraft" : mode,
        text,
        bufferPostId: mockPostId,
        status: "success",
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        isMock: true,
        postId: mockPostId,
        message: `[Demo Sandbox] Draft sent to ${channelName || "Buffer channel"} successfully!`,
      });
    }

    // Real Buffer API call
    const client = new BufferClient(token);
    const result = await client.createPost({
      channelId,
      text,
      saveToDraft: Boolean(saveToDraft),
      mode,
    });

    if (!result.success) {
      recordPostPublish({
        id: `pub_${Date.now()}`,
        userId,
        episodeId: episodeId || "ep_sample",
        draftId: draftId || "draft_manual",
        channelId,
        channelName: channelName || channelId,
        channelService: channelService || "generic",
        mode: saveToDraft ? "saveToDraft" : mode,
        text,
        status: "failed",
        errorMessage: result.errorMessage,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || "Buffer failed to accept the post.",
        },
        { status: 400 }
      );
    }

    recordPostPublish({
      id: `pub_${Date.now()}`,
      userId,
      episodeId: episodeId || "ep_sample",
      draftId: draftId || "draft_manual",
      channelId,
      channelName: channelName || channelId,
      channelService: channelService || "generic",
      mode: saveToDraft ? "saveToDraft" : mode,
      text,
      bufferPostId: result.postId,
      status: "success",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      isMock: false,
      postId: result.postId,
      status: result.status,
      dueAt: result.dueAt,
      message: `Successfully created ${saveToDraft ? "draft" : "post"} in Buffer!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
