"use client";

import { useEffect, useState, useCallback } from "react";
import { BufferChannel } from "@/lib/buffer";
import { EpisodeRecord, PostPublishRecord } from "@/lib/db";
import { BufferChannelsBar } from "@/components/BufferChannelsBar";
import { AudioIntake } from "@/components/AudioIntake";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { DraftCard } from "@/components/DraftCard";
import { SparklesIcon, RadioIcon, SendIcon, RefreshIcon } from "@/components/Icons";
import Link from "next/link";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"repurpose" | "episodes" | "history" | "channels">("repurpose");
  const [channels, setChannels] = useState<BufferChannel[]>([]);
  const [bufferConnected, setBufferConnected] = useState<boolean>(false);
  const [isMockBuffer, setIsMockBuffer] = useState<boolean>(false);
  const [canOAuth, setCanOAuth] = useState<boolean>(false);
  const [channelsLoading, setChannelsLoading] = useState<boolean>(true);

  const [currentEpisode, setCurrentEpisode] = useState<EpisodeRecord | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<EpisodeRecord[]>([]);
  const [publishHistory, setPublishHistory] = useState<PostPublishRecord[]>([]);
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

  // Fetch episodes library
  const fetchEpisodes = useCallback(async () => {
    try {
      const res = await fetch("/api/episodes");
      const data = await res.json();
      if (data.episodes) {
        setAllEpisodes(data.episodes);
        if (!currentEpisode && data.episodes.length > 0) {
          setCurrentEpisode(data.episodes[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch episodes:", err);
    }
  }, [currentEpisode]);

  // Fetch publishing history
  const fetchPublishHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/buffer/history");
      const data = await res.json();
      if (data.history) {
        setPublishHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch publish history:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("buffer_connected")) {
      setBannerNotice("Buffer connected successfully! Your channels are now active.");
      window.history.replaceState({}, "", "/dashboard");
    } else if (params.get("buffer_error")) {
      setBannerNotice(`Buffer connection note: ${params.get("buffer_error")}`);
      window.history.replaceState({}, "", "/dashboard");
    }
    fetchBufferChannels();
    fetchEpisodes();
    fetchPublishHistory();
  }, [fetchBufferChannels, fetchEpisodes, fetchPublishHistory]);

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

  // Poll processing episode
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
            fetchEpisodes();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchEpisodes]);

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

  // In-place draft editing
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

      setCurrentEpisode((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drafts: prev.drafts.map((d) => (d.id === draftId ? { ...d, content: newContent } : d)),
        };
      });
      fetchEpisodes();
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
    const result = await res.json();
    fetchPublishHistory();
    return result;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background ambient gradient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-60 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#090e1a]/95 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex min-h-screen sticky top-0">
        <div>
          {/* Logo Area */}
          <div className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Podloom
              </span>
            </Link>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
              PRO
            </span>
          </div>

          {/* Nav Items */}
          <div className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("repurpose")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "repurpose"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <SparklesIcon className="w-4 h-4 shrink-0" />
              <span>Studio & Repurpose</span>
            </button>

            <button
              onClick={() => setActiveTab("episodes")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "episodes"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioIcon className="w-4 h-4 shrink-0" />
                <span>Episode Library</span>
              </div>
              <span className="text-[10px] bg-slate-800/90 px-2 py-0.5 rounded-full font-mono">
                {allEpisodes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <SendIcon className="w-4 h-4 shrink-0" />
                <span>Buffer Dispatch Log</span>
              </div>
              <span className="text-[10px] bg-slate-800/90 px-2 py-0.5 rounded-full font-mono">
                {publishHistory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("channels")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "channels"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioIcon className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Connected Channels</span>
              </div>
              <span className="text-[10px] bg-slate-800/90 px-2 py-0.5 rounded-full font-mono">
                {channels.length}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Account / Buffer Status */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-300">Buffer Integration</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  bufferConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              ></span>
            </div>
            <p className="text-[10px] text-slate-400">
              {bufferConnected
                ? `${channels.length} channel${channels.length === 1 ? "" : "s"} synced`
                : "Buffer not connected"}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <Link href="/" className="hover:text-slate-200 transition-colors">
              ← Overview
            </Link>
            <Link href="/privacy" className="hover:text-slate-200 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Tab Pills */}
            <div className="flex md:hidden bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("repurpose")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                  activeTab === "repurpose" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Studio
              </button>
              <button
                onClick={() => setActiveTab("episodes")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                  activeTab === "episodes" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Episodes
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                  activeTab === "history" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                Log
              </button>
            </div>

            <div className="hidden md:block">
              <h1 className="text-sm font-bold text-slate-100 capitalize">
                {activeTab === "repurpose" && "AI Repurposing Studio"}
                {activeTab === "episodes" && "Episode Library"}
                {activeTab === "history" && "Buffer Publishing History"}
                {activeTab === "channels" && "Connected Social Destinations"}
              </h1>
              <p className="text-[11px] text-slate-400">
                Turn long-form podcast audio into scheduled social media assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Whisper-1 & GPT-4o-mini Ready</span>
            </div>

            <a
              href="https://buffer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all"
            >
              Buffer Docs ↗
            </a>
          </div>
        </header>

        {/* View Content */}
        <main className="p-4 sm:p-8 flex-1 space-y-6 max-w-7xl w-full mx-auto">
          {/* Banner Notice */}
          {bannerNotice && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200 shadow-md">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{bannerNotice}</span>
              </div>
              <button
                onClick={() => setBannerNotice(null)}
                className="text-indigo-400 hover:text-indigo-200 font-mono text-sm ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: STUDIO & REPURPOSE */}
          {activeTab === "repurpose" && (
            <div className="space-y-6">
              {/* Buffer Bar */}
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

              {/* Audio Intake */}
              <AudioIntake
                onStartProcessing={handleStartProcessing}
                isProcessing={isProcessing}
              />

              {/* Processing Bar */}
              {currentEpisode && currentEpisode.status !== "idle" && (
                <ProcessingStatus episode={currentEpisode} />
              )}

              {/* Episode Result View */}
              {currentEpisode && currentEpisode.status === "completed" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold tracking-widest">
                        Loaded Episode
                      </span>
                      <h2 className="text-xl font-bold text-slate-100 mt-0.5">{currentEpisode.title}</h2>
                    </div>
                    <span className="text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {currentEpisode.drafts.length} ready-to-publish drafts
                    </span>
                  </div>

                  {/* Transcript Viewer */}
                  {currentEpisode.transcript && (
                    <TranscriptViewer
                      transcript={currentEpisode.transcript}
                      keyMoments={currentEpisode.keyMoments}
                    />
                  )}

                  {/* Social Draft Cards */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Social Media Drafts</h3>
                      <p className="text-xs text-slate-400">
                        Tailored for individual platform constraints. Edit before sending to Buffer.
                      </p>
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
            </div>
          )}

          {/* TAB 2: EPISODES LIBRARY */}
          {activeTab === "episodes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Processed Episodes</h2>
                  <p className="text-xs text-slate-400">
                    All episodes processed in your current workspace session.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("repurpose")}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Process New Episode</span>
                </button>
              </div>

              {allEpisodes.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#090e1a] border border-slate-800/80">
                  <p className="text-xs text-slate-400">No episodes processed yet in this session.</p>
                  <button
                    onClick={() => setActiveTab("repurpose")}
                    className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-950/40 border border-indigo-700/50 rounded-xl"
                  >
                    Load Sample Episode
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {allEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => {
                        setCurrentEpisode(ep);
                        setActiveTab("repurpose");
                      }}
                      className="p-4 rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-200">{ep.title}</h3>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              ep.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-indigo-500/10 text-indigo-400"
                            }`}
                          >
                            {ep.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {ep.drafts.length} drafts generated &bull; {new Date(ep.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                        Open in Studio →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BUFFER DISPATCH LOG */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Buffer Dispatch History</h2>
                  <p className="text-xs text-slate-400">
                    Live log of all drafts dispatched from Podloom into your Buffer account.
                  </p>
                </div>
                <button
                  onClick={fetchPublishHistory}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl"
                  title="Refresh"
                >
                  <RefreshIcon className="w-4 h-4" />
                </button>
              </div>

              {publishHistory.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#090e1a] border border-slate-800/80">
                  <p className="text-xs text-slate-400">No drafts sent to Buffer yet.</p>
                  <button
                    onClick={() => setActiveTab("repurpose")}
                    className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-950/40 border border-indigo-700/50 rounded-xl"
                  >
                    Generate & Send Draft
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {publishHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#090e1a] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {item.channelName}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {item.channelService}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            ✓ {item.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 line-clamp-1">{item.text}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-500 block">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400">
                          {item.bufferPostId ? `ID: ${item.bufferPostId.slice(0, 14)}...` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CHANNELS */}
          {activeTab === "channels" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">Connected Social Channels</h2>
                <p className="text-xs text-slate-400">
                  Buffer channels authorized to receive social posts and threads.
                </p>
              </div>

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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
