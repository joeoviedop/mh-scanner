# Rewrite Playbook

Use this as the launchpad when rebuilding mh-scanner from scratch. It synthesizes the prior implementation, highlights reusable pieces, and proposes a phased backlog for the coding agent.

## Product Vision
- Monitor YouTube channels/playlists for mental-health content.
- Fetch transcripts, detect mentions, classify tone/sensitivity, and surface fragments for human review.
- Capture reviewer feedback to improve ranking quality over time.

## North-Star Experience
1. Auth with a simple passcode → land on dashboard summarizing monitored sources.
2. Add a YouTube URL and schedule its scan cadence.
3. For each episode: fetch transcript, run mention detection, inspect fragments.
4. Reviewers vote on fragment usefulness; rankings adjust accordingly.

## Build Phases (Suggested)
1. **Foundation**: Next 15 App Router + Tailwind, Convex schema, passcode auth + middleware.
2. **Source Intake**: YouTube URL parsing, Convex `channelActions.scanSource`, dashboard forms.
3. **Transcription**: Apify integration, transcript storage/UI, state indicators.
4. **Mention Detection**: Keyword prefilter, OpenAI classification, fragment storage.
5. **Review Surfaces**: Episode detail views, keyword highlighting, feedback capture.
6. **Analytics & Ranking**: Feedback-driven reranking, metrics tiles, QA scripts.

Each phase should ship vertical slices (UI → API route → Convex logic → integration) to keep the pipeline testable at all times.

## Reusable Assets
- **Libraries**: `lib/integrations/apify/transcript.ts`, `lib/integrations/llm/openai.ts`, `lib/integrations/youtube/youtube-parser.ts`, duration + keyword helpers.
- **API Signatures**: Keep `POST /api/youtube/scan`, `/api/youtube/fetch-captions`, `/api/process/detect-mentions`, `/api/feedback`, etc. Their payloads are well-tested and clients already exist.
- **Convex Tables**: Reuse schema definitions unless you have a strong reason to reshape data. Existing indexes support UI filters and job lookups.
- **Scripts**: `scripts/initialize-keywords.js` and smoke tests provide quick validation during rebuilds.

## Data Contracts
- **Channel summary** returned to the dashboard should expose `episodesProcessed`, `newEpisodes`, `skippedEpisodes`.
- **Transcript shape** mirrors `transcriptions` table: `segments` array with `start`, `end`, `text`.
- **Fragment classification** must satisfy `FragmentClassification` interface (tema, tono, sensibilidad[], confianza, optional tags/razon).

## Definition of Done per Feature
- UI renders the relevant state (loading, empty, success, error).
- API route validates inputs and returns structured error messages for user surfacing.
- Convex action/query handles idempotency (repeated requests should not duplicate data).
- External service errors bubble back with actionable logs (console or Convex dashboard).
- Docs updated (`docs/decisions.md`, `docs/pitfalls.md`, `docs/checklists.md`) with any new learning.

## Manual Regression Suite
- Scan a small playlist (<10 videos) to test pagination + skip logic.
- Scan a long channel (~100 videos) to stress progress updates.
- Run transcription on a 1-hour video; verify segments align with timestamps in the UI.
- Trigger mention detection on transcripts with tricky phrasing (metaphors, sarcasm) to confirm keyword filter coverage.
- Submit conflicting feedback (useful + not useful) on the same fragment; ensure reranking handles ties gracefully.

## Open Questions to Track
- Should we introduce retries/backoff for YouTube quota errors?
- Do we need multi-passcode / role-based access as reviewers grow?
- Is there a requirement for exporting data (CSV, Convex export) for analytics?

Log answers and new discoveries in `docs/decisions.md` so the next iteration benefits.
