# Podloom — Podcast to Buffer Social Drafts

Podloom transforms podcast audio episodes into high-engagement, platform-specific social media copy (X/Twitter, LinkedIn, Threads, Instagram/Reels) and sends selected drafts directly into connected **Buffer** channels using Buffer's GraphQL API.

---

## 🚀 Features

- **Buffer GraphQL Integration:** Uses official GraphQL mutations and queries (`createPost`, `channels`, `account`) targeting `https://api.buffer.com`.
- **Flexible Buffer Authentication:**
  - Standard OAuth 2.0 PKCE flow (`https://auth.buffer.com/auth` and `https://auth.buffer.com/token`).
  - Direct Token/API Key entry for instant connection.
  - Built-in 1-Click Demo Sandbox for offline evaluation without setup friction.
- **Audio Intake Pipelines:**
  - File upload (`.mp3`, `.wav`, `.m4a`).
  - Public audio stream URL (direct MP3 or podcast CDN).
  - Preloaded sample episode with full verified transcript.
- **AI Processing Engine:**
  - **OpenAI Whisper** for speech-to-text audio transcription.
  - **GPT-4o-mini** for structured key moments extraction and multi-platform draft generation.
- **Podloom Studio:**
  - Inline draft text editing with character counters and length alerts.
  - Channel picker showing active connected platforms.
  - Toggle between **Buffer Draft** (`saveToDraft: true`) or **Add to Queue** mode.
- **Security & Isolation:**
  - Server-side AES-256-GCM encryption for stored Buffer credentials.
  - Strict user and session record isolation.

---

## 🛠️ Local Development & Quick Start

### 1. Requirements
- Node.js 18+ (tested with Node.js v22.18.0)
- npm 9+

### 2. Environment Setup
Create or update `.env.local`:
```env
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Buffer Credentials
BUFFER_CLIENT_ID=
BUFFER_CLIENT_SECRET=
BUFFER_REDIRECT_URI=http://localhost:3000/api/buffer/callback
BUFFER_ACCESS_TOKEN=

# OpenAI API Key (Whisper & GPT-4o-mini)
OPENAI_API_KEY=your-openai-api-key

# Session Secret (Server-side AES-256 encryption)
SESSION_SECRET=podloom_secure_master_secret_2026_buffer_transcribe
```

### 3. Run Locally
```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Build production bundle
npm run build

# Start production server
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel / Cloud

1. Create a repository on GitHub (e.g. `https://github.com/Karushna/podloom`):
   ```bash
   git remote add origin https://github.com/<your-username>/podloom.git
   git push -u origin master
   ```
2. Import the repository into [Vercel](https://vercel.com) (or Render/Railway).
3. Set the Environment Variables (`OPENAI_API_KEY`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, `BUFFER_CLIENT_ID`, `BUFFER_CLIENT_SECRET`).
4. Click **Deploy**.
