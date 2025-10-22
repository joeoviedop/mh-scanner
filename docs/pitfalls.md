# Pitfalls & Gotchas

Field notes from the first build. Keep these handy during the rewrite so we do not fall into the same traps.

## Environment & Configuration
- `NEXT_PUBLIC_CONVEX_URL` is required on both server and edge runtimes. Every API route calls `new ConvexHttpClient(url)`; missing or mismatched URLs yield opaque 500s. Double-check `.env.local` and Vercel project settings before booting the UI.
- Convex secrets live in the Convex dashboard, not `.env`. Always mirror required keys in `.env.local.example` **and** run `npx convex env set NAME VALUE` when provisioning a new environment.
- Node must be ≥ 18.17.0. Some dependencies (Convex, Next 15) rely on the global fetch implementation that ships with Node 18+.
- For local scripts, remember to export `OPENAI_API_KEY`, `YOUTUBE_API_KEY`, and `APIFY_TOKEN`. The guards in `lib/integrations/*` throw immediately but scripts like `scripts/test-openai.js` will otherwise hang waiting for network retries.

## External Services
- **YouTube Data API**: quota errors manifest as `403 quotaExceeded`. The Convex YouTube client does not automatically back off. Spread high-volume scans across multiple API keys if needed.
- **YouTube Captions**: not every video exposes captions. Apify responses may be empty; Convex actions treat this as a non-fatal state and flag `episodes.transcriptionError`. Surface this in the UI instead of retry-spinning.
- **Apify**: the actor responds with many possible timestamp field names. We normalize them, but if Apify changes schema, update the parser (`lib/integrations/apify/transcript.ts`). Long videos can exceed default dataset page size—configure `APIFY_DATASET_PAGE_SIZE`/`MAX_ITEMS` if you hit truncation.
- **OpenAI**: the custom JSON schema requires responses to be valid JSON. The client already retries parsing, but keep model temperature low (`0.2`) to avoid creative outputs. Ensure keys start with `sk-`; the guard treats anything else as invalid.

## Data & Processing
- Shorts (videos under 120 seconds) are skipped during scans. If you test with short clips, they will never appear in the dashboard—pad with longer content or lower `MIN_DURATION_SECONDS`.
- Transcripts are stored per episode. Re-running transcription overwrites the existing entry; build snapshotting if historical comparisons matter.
- Keyword filters are utf-normalized but depend on curated lists. Always run `node scripts/initialize-keywords.js` after creating a fresh Convex deployment or you will get zero LLM candidates.
- Fragment ranking depends on human feedback. Until reviewers label examples, the UI may surface low-confidence hits; set expectations during demos.

## Frontend & UX
- Dashboard pages are server components with zero cache (`export const revalidate = 0`). Rendering will call Convex on every request. In production, ensure Convex endpoints are responsive (<1s) to avoid slow page loads.
- API routes return generic 500 messages. When debugging, check Convex logs or console output to find root causes (especially for Apify/OpenAI errors).

## Tooling
- TypeScript path aliases now resolve to the canonical `components/*` and `lib/*` trees. Remove or update any lingering `@/src/*` imports before extending modules to avoid module resolution errors.
- `npm run convex:dev` needs `YOUTUBE_API_KEY` and `APIFY_TOKEN` set in Convex env variables, not the local shell. Forgetting this results in runtime errors even if local `.env` is correct.
