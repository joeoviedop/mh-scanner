# Architecture Overview

Internal map of how mh-scanner stitches together the App Router, Convex, and the external services that power the scanning pipeline.

## System Map
```
┌────────────────────┐    form submits / fetch          ┌────────────────────┐
│ Next.js App Router │────────────────────────────────▶│ Next.js API Routes │
│  (app/(auth|dash)) │                                 │  (app/api/*)       │
└────────┬───────────┘                                 └────────┬───────────┘
         │  ConvexHttpClient queries/actions                     │
         ▼                                                       ▼
┌────────────────────┐   mutations + actions   ┌────────────────────────────────┐
│ Convex backend     │◀───────────────────────▶│ convex/* (channels, episodes,…)│
├────────────────────┤                         └────────────────────────────────┘
│ Tables: channels   │                                     │
│         episodes   │                           background jobs update status
│         transcri…  │                                     │
│         fragments  │                                     ▼
│         feedback   │                           ┌──────────────────────────────┐
│         scanJobs   │   fetches / webhooks      │ External services            │
└────────┬───────────┘──────────────────────────▶│• YouTube Data & Captions API │
         │                                       │• Apify transcript scraper    │
         │                                       │• OpenAI GPT-4o mini          │
         ▼                                       │• Internal keyword config     │
┌────────────────────┐                           └──────────────────────────────┘
│ Dashboard UI       │
│ (Episodes/Fragments│
│  review tools)     │
└────────────────────┘
```

## Layers in Practice
- **Next.js App Router (`app/`)** renders auth and dashboard views. Server components fetch Convex data via `ConvexHttpClient` to keep browser bundles small. Client components (`components/…`) handle forms and interactive lists.
- **Next.js API routes (`app/api/*`)** expose narrow endpoints the dashboard can call without shipping secrets. They validate payloads, call Convex actions/queries, and translate errors into HTTP responses.
- **Convex backend (`convex/`)** centralizes the schema (`schema.ts`), data access, and long-running orchestration (`channelActions.ts`, `scanJobs.ts`, `mentionActions.ts`, etc.). Convex actions coordinate calls to YouTube, Apify, and OpenAI, persist intermediate results, and update job progress.
- **Domain libraries (`lib/`)** hold reusable helpers for integrations (YouTube API client, Apify transcript normalizer, OpenAI client) and processing utilities (`keyword-filter.ts`, duration parsing, URL parsing). API routes and Convex actions import these to stay thin.
- **Automation scripts (`scripts/`)** let you seed keywords and run smoke checks for Apify/OpenAI without touching the UI. They are plain Node scripts that reuse the same libraries.

## Primary Flows
### 1. Source scanning
1. Dashboard form posts to `POST /api/youtube/scan`.
2. Route parses/validates the URL via `lib/integrations/youtube/youtube-parser.ts`.
3. It triggers `convex/channelActions.scanSource`, which:
   - Upserts the channel/playlist in `channels`.
   - Pages through YouTube Data API results (up to 3×50 videos).
   - Filters out shorts (`durationSeconds < 120`).
   - Upserts episodes, updates `scanJobs` progress, and timestamps the channel’s `lastScanAt`.

### 2. Transcription
1. When the dashboard requests captions, it calls `POST /api/youtube/fetch-captions`.
2. The API route dispatches `convex/transcriptionActions.requestTranscription`.
3. Convex action launches an Apify run (`lib/integrations/apify/transcript.ts`), polls until ready, normalizes segment timestamps, and stores the result under `transcriptions`, toggling `episodes.hasTranscription`.

### 3. Mention detection & classification
1. API route `POST /api/process/detect-mentions` asks Convex to process a batch.
2. `convex/mentionActions.ts` pulls transcript segments, runs the keyword pre-filter (`lib/processing/keyword-filter.ts`), and requests classification from OpenAI (`lib/integrations/llm/openai.ts`).
3. For each fragment, it writes to `fragments`, updates episode metrics (`hasMentions`, `mentionCount`, `averageConfidence`), and records feedback placeholders.

### 4. Human review & feedback
- Dashboard pages under `app/(dashboard)/episodes/[episodeId]` fetch fragments + transcripts, render them with highlight helpers from `components/fragments/*`, and expose feedback forms.
- Feedback submissions hit `POST /api/feedback`, which mutates the `feedback` table and triggers `convex/mentionActions.recalculateRanking` to adjust episode ordering.

## Data Model Summary
- `channels`: YouTube entities plus scan controls (frequency, status, error state).
- `episodes`: Individual videos with YouTube metadata, processing flags, and health metrics.
- `transcriptions`: Full text + segment array, language metadata, keyword pre-flag.
- `fragments`: Context windows, AI classification, timestamps.
- `feedback`: User judgments with reason codes.
- `scanJobs`: Long-lived operations to track progress/errors and support retries.

## External Dependencies
- **YouTube Data API v3** for channel/playlist listings and video metadata. Requires `YOUTUBE_API_KEY` and respects quota; retry logic is handled by the Convex YouTube client.
- **Apify transcript scraper** (actor `pintostudio/youtube-transcript-scraper`) for caption retrieval. Token and actor ID are configurable; dataset pagination is handled internally.
- **OpenAI Chat Completions** (`gpt-4o-mini`) for semantic classification. Requests enforce JSON schema output to simplify parsing and set a low temperature for determinism.
- **Keyword configuration** lives in Convex storage (`convex/config.ts`). Scripts under `scripts/initialize-keywords*.js` seed default lists.

## Frontend Composition
- **Auth**: `app/(auth)/login/page.tsx` renders the passcode gate; middleware enforces session cookies.
- **Dashboard root**: `app/(dashboard)/dashboard/page.tsx` + `DashboardPageClient.tsx` show channel stats and trigger scans.
- **Episodes**: `app/(dashboard)/episodes/page.tsx` and `EpisodesPageClient.tsx` list episodes with status filters and call APIs for transcriptions/detection.
- **Episode detail**: `app/(dashboard)/dashboard/episodes/page.tsx` (and dynamic child pages) render transcripts, keyword highlights, fragments, and feedback controls.

Use this map as the north star when reimplementing features: preserve the same seams (form → API route → Convex action → external service) so secrets and background work stay server-side while the dashboard remains responsive.
