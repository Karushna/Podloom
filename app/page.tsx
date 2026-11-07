"use client";

import { useEffect, useState, useCallback } from "react";
import { BufferChannel } from "@/lib/buffer";
import { EpisodeRecord } from "@/lib/db";
import { BufferChannelsBar } from "@/components/BufferChannelsBar";
import { AudioIntake } from "@/components/AudioIntake";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { DraftCard } from "@/components/DraftCard";
import { SparklesIcon, RefreshIcon } from "@/components/Icons";
import Link from "next/link";

export default function Home() {
  const [channels, setChannels] = useState<BufferChannel[]>([]);
  const [bufferConnected, setBufferConnected] = useState<boolean>(false);
  const [isMockBuffer, setIsMockBuffer] = useState<boolean>(false);
  const [canOAuth, setCanOAuth] = useState<boolean>(false);
  const [channelsLoading, setChannelsLoading] = useState<boolean>(true);

  const [currentEpisode, setCurrentEpisode] = useState<EpisodeRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Fetch Buffer Channel status
  const fetchBufferChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const res = await fetch("/api/buffer/channels");
      const data = await res.json();
      setBufferConnected(Boolean(data.connected));
      setIsMockBuffer(Boolean(data.isMock));
      setChannels(data.channels || []);
      setCanOAuth(Boolean(data.canOAuth));
    } catch (err) {
      console.error("Failed to load channels:", err);
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  // Check URL params for OAuth return query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("buffer_connected")) {
      setBannerNotice("Buffer account connected successfully via OAuth!");
      window.history.replaceState({}, "", "/");
    } else if (params.get("buffer_error")) {
      setBannerNotice(`Buffer OAuth error: ${params.get("buffer_error")}`);
      window.history.replaceState({}, "", "/");
    }
    fetchBufferChannels();
  }, [fetchBufferChannels]);

  // Connect via API key
  const handleConnectToken = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/buffer/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect_token", accessToken: token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBufferChannels();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Connect Demo mode
  const handleConnectDemo = async () => {
    await fetch("/api/buffer/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connect_demo" }),
    });
    await fetchBufferChannels();
  };

  // Disconnect Buffer
  const handleDisconnectBuffer = async () => {
    await fetch("/api/buffer/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    });
    await fetchBufferChannels();
  };

  // Poll processing episode until completed or error
  const pollEpisode = useCallback((episodeId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/episodes?id=${episodeId}`);
        const data = await res.json();
        if (data.episode) {
          setCurrentEpisode(data.episode);
          if (data.episode.status === "completed" || data.episode.status === "error") {
            clearInterval(interval);
            setIsProcessing(false);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Start processing audio
  const handleStartProcessing = async (data: {
    sourceType: "upload" | "url" | "sample";
    title?: string;
    audioUrl?: string;
    audioFile?: File;
  }) => {
    setIsProcessing(true);
    try {
      let res: Response;
      if (data.audioFile) {
        const fd = new FormData();
        fd.append("sourceType", data.sourceType);
        if (data.title) fd.append("title", data.title);
        fd.append("audioFile", data.audioFile);
        res = await fetch("/api/episodes", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/episodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: data.sourceType,
            title: data.title,
            audioUrl: data.audioUrl,
          }),
        });
      }

      const resData = await res.json();
      if (resData.episode) {
        setCurrentEpisode(resData.episode);
        pollEpisode(resData.episode.id);
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setIsProcessing(false);
    }
  };

  // Update a draft in place
  const handleUpdateDraft = async (draftId: string, newContent: string) => {
    if (!currentEpisode) return;
    try {
      await fetch("/api/episodes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId: currentEpisode.id,
          draftId,
          content: newContent,
        }),
      });

      // Update local state
      setCurrentEpisode((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drafts: prev.drafts.map((d) => (d.id === draftId ? { ...d, content: newContent } : d)),
        };
      });
    } catch (err) {
      console.error("Failed to update draft:", err);
    }
  };

  // Dispatch draft to Buffer
  const handleSendToBuffer = async (params: {
    channelId: string;
    channelName: string;
    channelService: string;
    text: string;
    saveToDraft: boolean;
    mode: "addToQueue" | "shareNow";
    draftId: string;
  }) => {
    const res = await fetch("/api/buffer/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        episodeId: currentEpisode?.id,
      }),
    });
    return await res.json();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Podloom</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Buffer Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Podcast to Multi-Platform Social Media Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Privacy Policy
            </Link>
            <a
              href="https://buffer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Buffer Docs ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Banner alerts */}
        {bannerNotice && (
          <div className="mb-6 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
            <span>{bannerNotice}</span>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-indigo-400 hover:text-indigo-200 ml-4 font-mono text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Buffer Status Component */}
        <BufferChannelsBar
          channels={channels}
          connected={bufferConnected}
          isMock={isMockBuffer}
          canOAuth={canOAuth}
          isLoading={channelsLoading}
          onRefresh={fetchBufferChannels}
          onDisconnect={handleDisconnectBuffer}
          onConnectToken={handleConnectToken}
          onConnectDemo={handleConnectDemo}
        />

        {/* Audio Intake Component */}
        <AudioIntake
          onStartProcessing={handleStartProcessing}
          isProcessing={isProcessing}
        />

        {/* Processing Indicator */}
        {currentEpisode && currentEpisode.status !== "idle" && (
          <ProcessingStatus episode={currentEpisode} />
        )}

        {/* Episode Content */}
        {currentEpisode && currentEpisode.status === "completed" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold tracking-wider">
                  Active Episode
                </span>
                <h2 className="text-lg font-bold text-slate-100">{currentEpisode.title}</h2>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                {currentEpisode.drafts.length} drafts ready
              </span>
            </div>

            {/* Transcript & Moments viewer */}
            {currentEpisode.transcript && (
              <TranscriptViewer
                transcript={currentEpisode.transcript}
                keyMoments={currentEpisode.keyMoments}
              />
            )}

            {/* Social Media Drafts Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span>Generated Social Drafts</span>
                  <span className="text-xs font-normal text-slate-400">
                    (review, refine, and send to Buffer)
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentEpisode.drafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    episodeId={currentEpisode.id}
                    channels={channels}
                    isBufferConnected={bufferConnected}
                    onUpdateDraft={handleUpdateDraft}
                    onSendToBuffer={handleSendToBuffer}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
        <p>Podloom &bull; Powered by OpenAI Whisper, GPT-4o-mini & Buffer GraphQL API</p>
        <Link href="/privacy" className="text-slate-400 hover:text-slate-300 underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
