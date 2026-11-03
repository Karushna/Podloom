"use client";

import { EpisodeRecord } from "@/lib/db";
import { SparklesIcon, RefreshIcon, CheckCircleIcon, ExclamationCircleIcon } from "./Icons";

interface ProcessingStatusProps {
  episode: EpisodeRecord;
}

export function ProcessingStatus({ episode }: ProcessingStatusProps) {
  const isDone = episode.status === "completed";
  const isError = episode.status === "error";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isDone ? (
            <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
          ) : isError ? (
            <ExclamationCircleIcon className="w-5 h-5 text-rose-400" />
          ) : (
            <RefreshIcon className="w-5 h-5 text-indigo-400 animate-spin" />
          )}
          <span className="text-xs font-semibold text-slate-200">
            {episode.status === "transcribing" && "Step 1/2: OpenAI Whisper Audio Transcription"}
            {episode.status === "generating" && "Step 2/2: Platform Draft & Key Moments Synthesis"}
            {episode.status === "completed" && "Processing Complete"}
            {episode.status === "error" && "Processing Encountered An Error"}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">{episode.progressPercent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isError ? "bg-rose-500" : isDone ? "bg-emerald-500" : "bg-indigo-500"
          }`}
          style={{ width: `${episode.progressPercent}%` }}
        />
      </div>

      <p className="text-xs text-slate-400">{episode.statusMessage}</p>
    </div>
  );
}
