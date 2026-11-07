import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Podloom",
  description: "Privacy Policy for Podloom podcast-to-social Buffer dispatch application.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 7, 2026";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold text-sm">
            ← Back to Podloom Studio
          </Link>
          <span className="text-xs text-slate-500">Legal & Transparency</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mt-2">Last Updated: {lastUpdated}</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">1. Overview</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Podloom (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) provides an automated tool for creators to transform podcast episodes into platform-optimized social media drafts and schedule or publish them through connected Buffer accounts. This Privacy Policy describes how your information is collected, used, and secured when you use Podloom.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">2. Information We Collect</h2>
          <ul className="list-disc pl-5 text-sm text-slate-400 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-300">Buffer Account Information:</strong> When you connect your Buffer account via OAuth or personal API credentials, we receive authentication tokens, your organization identifiers, and connected channel details (channel names, avatars, and service types such as X, LinkedIn, Threads, Instagram). We do not collect or store your Buffer master password.
            </li>
            <li>
              <strong className="text-slate-300">Podcast Content & Audio:</strong> Audio files or publicly accessible audio URLs submitted for transcription, along with the resulting transcripts, extracted key moments, and generated social drafts.
            </li>
            <li>
              <strong className="text-slate-300">Technical Session Data:</strong> Anonymous session identifiers stored via secure cookies or request headers to isolate your workspace records from other users.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 text-sm text-slate-400 space-y-2 leading-relaxed">
            <li>To transcribe audio and extract key moments using speech-to-text models (OpenAI Whisper).</li>
            <li>To synthesize platform-specific social media post drafts tailored to your podcast topic.</li>
            <li>To retrieve your authorized Buffer channels and dispatch user-approved drafts directly to Buffer via the official Buffer GraphQL API.</li>
            <li>To maintain isolated session workspaces and display publishing history to the active session owner.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">4. Third-Party Services & Data Sharing</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Podloom does not sell, rent, or trade your personal information. We transmit data only to essential third-party service providers necessary to operate the application:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-400 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-300">Buffer Inc. (API / OAuth):</strong> To access your connected social channels and schedule/post drafts at your direction. Subject to <a href="https://buffer.com/legal" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Buffer&apos;s Privacy Policy</a>.
            </li>
            <li>
              <strong className="text-slate-300">OpenAI:</strong> To provide audio transcription and draft generation. Audio segments and transcripts are processed in accordance with OpenAI&apos;s API data privacy terms and are not used for model training under standard API usage terms.
            </li>
            <li>
              <strong className="text-slate-300">Hosting Provider (Vercel):</strong> Infrastructure, edge routing, and secure HTTPS delivery.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">5. Security of Stored Credentials</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Security is paramount:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-400 space-y-2 leading-relaxed">
            <li>Buffer access tokens are encrypted server-side using industry-standard <strong>AES-256-GCM</strong> encryption before storage.</li>
            <li>Buffer credentials and secret keys are never exposed or transmitted to client web browsers.</li>
            <li>All communications between your browser, our application, and Buffer use encrypted HTTPS (TLS).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">6. User Control & Data Retention</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You may disconnect your Buffer integration at any time by clicking the &ldquo;Disconnect&rdquo; button in the Podloom dashboard. Disconnecting immediately removes your stored encrypted access tokens. You can also revoke Podloom&apos;s access directly from your Buffer account settings under Authorized Apps.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">7. Contact & Inquiries</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            If you have any questions or privacy concerns regarding this policy, please reach out via GitHub or through the Podloom application support channels.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Podloom &bull; Built for Creators and Podcast Marketers
      </footer>
    </div>
  );
}
