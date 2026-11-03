"use client";

import { useState } from "react";
import { SocialDraft } from "@/lib/db";
import { BufferChannel } from "@/lib/buffer";
import { PlatformBadge, SendIcon, CheckCircleIcon, ExclamationCircleIcon, RefreshIcon } from "./Icons";

interface DraftCardProps {
  draft: SocialDraft;
  episodeId: string;
  channels: BufferChannel[];
  isBufferConnected: boolean;
  onUpdateDraft: (draftId: string, newContent: string) => Promise<void>;
  onSendToBuffer: (params: {
    channelId: string;
    channelName: string;
    channelService: string;
    text: string;
    saveToDraft: boolean;
    mode: "addToQueue" | "shareNow";
    draftId: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function DraftCard({
  draft,
  episodeId,
  channels,
  isBufferConnected,
  onUpdateDraft,
  onSendToBuffer,
}: DraftCardProps) {
  const [content, setContent] = useState(draft.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pick matching channel by default
  const defaultChannel =
    channels.find((c) => c.service.toLowerCase().includes(draft.platform)) ||
    channels[0] ||
    null;

  const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannel?.id || "");
  const [saveToDraft, setSaveToDraft] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const characterCount = content.length;
  const isOverLimit = draft.characterLimit ? characterCount > draft.characterLimit : false;

  const handleSaveText = async () => {
    setIsSaving(true);
    try {
      await onUpdateDraft(draft.id, content);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!selectedChannelId) {
      setStatusMessage({ type: "error", text: "Please select a Buffer channel destination." });
      return;
    }
    const targetChannel = channels.find((c) => c.id === selectedChannelId);
    if (!targetChannel) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await onSendToBuffer({
        channelId: targetChannel.id,
        channelName: targetChannel.name,
        channelService: targetChannel.service,
        text: content,
        saveToDraft,
        mode: "addToQueue",
        draftId: draft.id,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Sent to Buffer successfully!",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to send to Buffer.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <PlatformBadge service={draft.platform} />
            <span className="text-xs font-semibold text-slate-300">{draft.title}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => {
                if (isEditing) handleSaveText();
                else setIsEditing(true);
              }}
              disabled={isSaving}
              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              {isEditing ? (isSaving ? "Saving..." : "Save") : "Edit"}
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="mb-4">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full text-xs font-mono bg-slate-950 border border-indigo-500/50 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed"
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="group relative cursor-pointer text-xs font-mono bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[140px]"
            >
              {content}
              <span className="absolute bottom-2 right-2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to edit
              </span>
            </div>
          )}

          {/* Character Counter */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-0.5">
            <span className={isOverLimit ? "text-rose-400 font-semibold" : ""}>
              {characterCount} {draft.characterLimit ? `/ ${draft.characterLimit}` : "characters"}
            </span>
            {isOverLimit && <span className="text-rose-400">Exceeds platform length limit</span>}
          </div>
        </div>
      </div>

      {/* Buffer Action Panel */}
      <div className="pt-3 border-t border-slate-800">
        {statusMessage && (
          <div
            className={`flex items-start gap-2 p-2.5 rounded-lg mb-3 text-xs ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <ExclamationCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-[11px] leading-tight">{statusMessage.text}</div>
          </div>
        )}

        {isBufferConnected ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="flex-1 text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Channel...</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.service.toUpperCase()}] {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSend}
                disabled={isSending || !selectedChannelId}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isSending ? (
                  <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <SendIcon className="w-3.5 h-3.5" />
                )}
                <span>Send to Buffer</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToDraft}
                  onChange={(e) => setSaveToDraft(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 text-xs"
                />
                <span>Save as Buffer Draft (recommended)</span>
              </label>
              <span className="text-slate-500">{saveToDraft ? "Draft" : "Add to Queue"}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            <p className="text-[11px] text-slate-400">Connect Buffer above to dispatch drafts</p>
          </div>
        )}
      </div>
    </div>
  );
}
