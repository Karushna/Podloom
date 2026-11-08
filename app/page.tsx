import Link from "next/link";
import { SparklesIcon, RadioIcon, SendIcon } from "@/components/Icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background radial glow effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <header className="border-b border-slate-800/60 bg-[#090e1a]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Podloom
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
            >
              Privacy Policy
            </Link>
            <a
              href="https://buffer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
            >
              Buffer Docs ↗
            </a>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all flex items-center gap-1.5"
            >
              <span>Try Free</span>
              <span className="text-indigo-200">→</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Automated Podcast Content Repurposing with Buffer Integration
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Turn podcast audio into{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">
              viral social drafts
            </span>{" "}
            and dispatch straight to Buffer.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload audio or paste a public podcast URL. Podloom extracts the punchiest moments with Whisper AI, formulates platform-specific posts, and dispatches them directly to your connected Buffer channels.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-4 h-4 text-white" />
              <span>Try Free (Instant Studio)</span>
            </Link>
            <a
              href="https://buffer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore Buffer API</span>
              <span className="text-slate-500">↗</span>
            </a>
          </div>

          {/* Social Platforms Support Pills */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="text-slate-500">Optimized for:</span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-400">
              𝕏 Twitter Threads
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-blue-400">
              LinkedIn Thought Leadership
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-purple-400">
              Threads Casual Takes
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-pink-400">
              Instagram Reels Captions
            </span>
          </div>

          {/* Interactive Preview Mockup */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/90 border border-slate-800 p-2 sm:p-4 shadow-2xl shadow-indigo-950/50">
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 font-mono text-[11px] text-slate-500">podloom-studio-preview.app</span>
                </div>
                <span className="hidden sm:inline-block text-[11px] text-indigo-400 font-mono">
                  Connected to Buffer GraphQL API
                </span>
              </div>

              {/* Preview Body */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    01
                  </div>
                  <h4 className="font-semibold text-slate-200 text-sm">Ingest Episode</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload MP3/WAV or input an episode feed URL. OpenAI Whisper transcribes every word with timestamps.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                    02
                  </div>
                  <h4 className="font-semibold text-slate-200 text-sm">Synthesize Moments</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    GPT-4o-mini extracts high-impact quotes and crafts platform-optimized copy with character length checks.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    03
                  </div>
                  <h4 className="font-semibold text-slate-200 text-sm">Send to Buffer</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select your connected Buffer channel. Save directly to your Buffer Drafts queue in 1 click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/60">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Built for speed, accuracy, and reach.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Every feature designed to cut podcast distribution time from 2 hours down to 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RadioIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-100">Live Buffer Channels</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect via OAuth or API key to automatically retrieve all your connected social channels (Twitter, LinkedIn, Threads, Instagram).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-100">Platform-Tailored Drafts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Posts are calibrated for algorithmic reach with proper hooks, line breaks, bullet points, and character limit indicators.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <SendIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-slate-100">Zero Credential Exposure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tokens are encrypted server-side using AES-256-GCM. User records and draft histories remain completely isolated.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-violet-950/60 border border-indigo-500/30 text-center space-y-5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to automate your podcast distribution?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Test out the sample episode or connect your Buffer account in seconds.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
              >
                <span>Try Free (Open Studio)</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#060911] py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
        <p>Podloom &bull; Powered by OpenAI Whisper, GPT-4o-mini & Buffer GraphQL API</p>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
            Studio Dashboard
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
            Buffer API
          </a>
        </div>
      </footer>
    </div>
  );
}
