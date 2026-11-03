"use client";

import { useState } from "react";
import { UploadIcon, LinkIcon, SparklesIcon, RefreshIcon } from "./Icons";

interface AudioIntakeProps {
  onStartProcessing: (data: {
    sourceType: "upload" | "url" | "sample";
    title?: string;
    audioUrl?: string;
    audioFile?: File;
  }) => Promise<void>;
  isProcessing: boolean;
}

export function AudioIntake({ onStartProcessing, isProcessing }: AudioIntakeProps) {
  const [tab, setTab] = useState<"sample" | "upload" | "url">("sample");
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "upload" && !audioFile) return;
    if (tab === "url" && !audioUrl.trim()) return;

    await onStartProcessing({
      sourceType: tab,
      title: title.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined,
      audioFile: audioFile || undefined,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
            Process Podcast Episode
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest podcast audio, generate OpenAI Whisper transcript, and produce platform-specific social copy.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setTab("sample")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              tab === "sample"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚡ Sample Episode
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              tab === "upload"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              tab === "url"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Audio URL
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Episode Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              tab === "sample"
                ? "Building Great Products in the Age of AI — Episode 42"
                : "e.g., Scaling Developer Tools with Sarah Lin"
            }
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tab Content */}
        {tab === "sample" && (
          <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/40 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">🎙️</span>
              <div className="text-xs">
                <span className="font-semibold text-indigo-300">
                  Ready-to-process Featured Episode
                </span>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Pre-loaded with audio stream and verified audio segment on product strategy, time-to-value, and developer speed. Instant zero-friction generation for evaluation.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "upload" && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Audio File (.mp3, .wav, .m4a)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-6 text-center bg-slate-950/40 cursor-pointer relative">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAudioFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              {audioFile ? (
                <div className="text-xs text-indigo-400 font-medium">
                  {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  <span className="text-indigo-400 font-medium">Click to upload</span> or drag and drop audio file
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "url" && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Public Audio URL (Direct MP3 / Podcast CDN)
            </label>
            <div className="relative">
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://feeds.podcast.com/episodes/42.mp3"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isProcessing}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-all shadow-md flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshIcon className="w-4 h-4 animate-spin" />
                <span>Processing Episode...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                <span>Generate Social Media Drafts</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
