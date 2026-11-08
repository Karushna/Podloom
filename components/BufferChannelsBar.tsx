"use client";

import { useState } from "react";
import { BufferChannel } from "@/lib/buffer";
import { CheckCircleIcon, ExclamationCircleIcon, RadioIcon, RefreshIcon } from "./Icons";

interface BufferChannelsBarProps {
  channels: BufferChannel[];
  connected: boolean;
  isMock: boolean;
  canOAuth: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
  onConnectToken: (token: string) => Promise<boolean>;
  onConnectDemo: () => Promise<void>;
}

export function BufferChannelsBar({
  channels,
  connected,
  isMock,
  canOAuth,
  isLoading,
  onRefresh,
  onDisconnect,
  onConnectToken,
  onConnectDemo,
}: BufferChannelsBarProps) {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setConnecting(true);
    setErrorMsg("");
    try {
      const ok = await onConnectToken(tokenInput.trim());
      if (ok) {
        setShowTokenModal(false);
        setTokenInput("");
      } else {
        setErrorMsg("Authentication failed. Please verify your Buffer token.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="bg-[#090e1a] border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-black/40 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Connection Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <RadioIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">Buffer Distribution Channels</h3>
              {connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isMock ? "Demo Sandbox Mode" : "Live Buffer Connected"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {connected
                ? `${channels.length} connected destination${channels.length === 1 ? "" : "s"} ready for instant dispatch`
                : "Authorize your Buffer account or use 1-click sandbox to send drafts into queue"}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {connected ? (
            <>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Sync Channels"
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
              >
                <RefreshIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onDisconnect}
                className="text-xs px-3.5 py-2 font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/30"
              >
                Disconnect
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {canOAuth && (
                <a
                  href="/api/buffer/authorize"
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all flex items-center gap-1.5"
                >
                  <span>Connect with Buffer OAuth</span>
                </a>
              )}
              <button
                onClick={() => setShowTokenModal(true)}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors"
              >
                API Key
              </button>
              <button
                onClick={onConnectDemo}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/50 rounded-xl transition-all"
              >
                ⚡ 1-Click Demo Sandbox
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connected Channel Pills */}
      {connected && channels.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">Active Channels:</span>
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 shadow-xs"
            >
              {ch.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ch.avatar} alt={ch.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-700" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              )}
              <span className="font-semibold">{ch.name}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {ch.service}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Connect Buffer Access Token</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your Buffer API key or Personal Access Token. It is encrypted on the server using AES-256 and never exposed to the browser.
            </p>

            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Buffer Token / API Key
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste your Buffer token..."
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {connecting && <RefreshIcon className="w-3.5 h-3.5 animate-spin" />}
                  Save & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
