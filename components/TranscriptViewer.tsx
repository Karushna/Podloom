"use client";

import { useState } from "react";
import { KeyMoment } from "@/lib/db";

interface TranscriptViewerProps {
  transcript: string;
  keyMoments: KeyMoment[];
}

export function TranscriptViewer({ transcript, keyMoments }: TranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState<"moments" | "full">("moments");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200">Episode Intelligence</h3>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("moments")}
            className={`px-3 py-0.5 text-xs font-medium rounded transition-colors ${
              activeTab === "moments" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Key Moments ({keyMoments.length})
          </button>
          <button
            onClick={() => setActiveTab("full")}
            className={`px-3 py-0.5 text-xs font-medium rounded transition-colors ${
              activeTab === "full" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Full Transcript
          </button>
        </div>
      </div>

      {activeTab === "moments" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {keyMoments.map((m) => (
            <div
              key={m.id}
              className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-indigo-300">{m.title}</span>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {m.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">{m.summary}</p>
              </div>
              <blockquote className="border-l-2 border-indigo-500/50 pl-2 text-[11px] text-slate-300 italic">
                &ldquo;{m.quote}&rdquo;
              </blockquote>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800 whitespace-pre-wrap">
          {transcript}
        </div>
      )}
    </div>
  );
}
