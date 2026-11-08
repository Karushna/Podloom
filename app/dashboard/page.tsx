"use client";

import { useEffect, useState, useCallback } from "react";
import { BufferChannel } from "@/lib/buffer";
import { EpisodeRecord } from "@/lib/db";
import { BufferChannelsBar } from "@/components/BufferChannelsBar";
import { AudioIntake } from "@/components/AudioIntake";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { DraftCard } from "@/components/DraftCard";
import { SparklesIcon } from "@/components/Icons";
import Link from "next/link";

export default function DashboardPage() {
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
      window.history.replaceState({}, "", "/dashboard");
    } else if (params.get("buffer_error")) {
      setBannerNotice(`Buffer OAuth error: ${params.get("buffer_error")}`);
      window.history.replaceState({}, "", "/dashboard");
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background ambient gradient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Podloom
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Studio Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              ← Overview
            </Link>
            <div className="h-4 w-px bg-slate-800"></div>
            <Link
              href="/privacy"
              className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              Privacy Policy
            </Link>
            <a
              href="https://buffer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all flex items-center gap-1.5"
            >
              Buffer Docs ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Banner notification */}
        {bannerNotice && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200 shadow-lg shadow-indigo-950/40">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{bannerNotice}</span>
            </div>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-indigo-400 hover:text-indigo-200 ml-4 font-mono text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Buffer Connection Bar */}
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
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold tracking-widest">
                  Active Episode
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-0.5">{currentEpisode.title}</h2>
              </div>
              <span className="text-xs font-medium text-slate-300 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {currentEpisode.drafts.length} social drafts synthesized
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <span>Generated Social Drafts</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review and edit copy customized for platform character limits, then dispatch directly into Buffer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      <footer className="border-t border-slate-900 bg-[#060911] py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2.5">
        <p>Podloom &bull; Powered by OpenAI Whisper, GPT-4o-mini & Buffer GraphQL API</p>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/" className="hover:text-slate-200 transition-colors">
            Overview
          </Link>
          <span>&bull;</span>
          <Link href="/privacy" className="hover:text-slate-200 transition-colors">
            Privacy Policy
          </Link>
          <span>&bull;</span>
          <a
            href="https://buffer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-200 transition-colors"
          >
            Buffer Platform
          </a>
        </div>
      </footer>
    </div>
  );
}
