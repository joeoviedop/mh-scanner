# Decision Log

Living record of architectural choices made during the first implementation. When rebuilding, preserve or revisit them intentionally instead of rediscovering the same trade-offs.

## ADR-001 – Passcode Auth + Middleware Gate
- **Status**: Accepted (2024-10-01)
- **Context**: Only a handful of internal reviewers need dashboard access; full OAuth or Convex auth would add setup overhead.
- **Decision**: Store a short-lived JWT in an HTTP-only cookie after validating a single passcode via `app/api/auth/verify-passcode`. Guard all App Router dashboard routes with middleware that checks the cookie signature.
- **Consequences**:
  - Fast local onboarding; no external identity provider required.
  - Passcode rotation is manual; add an admin tool in the future if rotation cadence increases.

## ADR-002 – Convex as the Source of Truth
- **Status**: Accepted (2024-10-02)
- **Context**: The app needed real-time updates (job progress, fragment availability) and serverless scaling without managing Prisma migrations.
- **Decision**: Use Convex tables (`channels`, `episodes`, `transcriptions`, `fragments`, `feedback`, `scanJobs`) with actions/queries as the single backend. Next.js API routes call Convex via `ConvexHttpClient`.
- **Consequences**:
  - Simplified data access and live query hooks in client components.
  - Ties runtime to Convex; if we switch to a traditional DB, re-implement job coordination and indexes.

## ADR-003 – Apify for Transcripts
- **Status**: Accepted (2024-10-03)
- **Context**: YouTube Captions API requires OAuth for many videos; maintaining browser automation was out of scope.
- **Decision**: Invoke Apify actor `pintostudio/youtube-transcript-scraper` from Convex actions, poll for completion, and normalize segments before storage.
- **Consequences**:
  - Reliable coverage for public videos; skips Shorts and videos without captions gracefully.
  - Adds dependency on Apify quotas and requires token management.

## ADR-004 – Keyword Prefilter Before LLM
- **Status**: Accepted (2024-10-05)
- **Context**: Sending entire transcripts to OpenAI was cost-prohibitive and slow.
- **Decision**: Use `lib/processing/keyword-filter.ts` to scan transcript segments for therapy-related terms, expanding ±45 seconds for context, and cap matches (default 25) before LLM classification.
- **Consequences**:
  - Greatly reduced token usage; keeps model calls deterministic.
  - Risk of missing euphemistic mentions; maintain keyword list under Convex config and keep scripts for reseeding.

## ADR-005 – Skip Videos Under 120 Seconds
- **Status**: Accepted (2024-10-06)
- **Context**: Shorts produce noise and rarely contain longform therapy discussions.
- **Decision**: When scanning channels/playlists, ignore videos where `durationSeconds < 120`.
- **Consequences**:
  - Focuses processing budget on longform content.
  - If short-form analysis becomes a need, adjust `MIN_DURATION_SECONDS` in `convex/channelActions.ts`.

## ADR-006 – Feedback-Driven Re-Ranking
- **Status**: Accepted (2024-10-08)
- **Context**: Human reviewers needed a way to correct the AI ranking and capture false positives.
- **Decision**: Persist fragment feedback (`useful` boolean + reason) and recompute a blended score combining model confidence with human votes inside Convex.
- **Consequences**:
  - Reviewers see improved ordering over time.
  - Requires enough labeled data; add analytics dashboards to surface impact (`Fase 6` deliverables).

## ADR-007 – Strict Environment Separation
- **Status**: Accepted (2024-10-09)
- **Context**: Secrets should never land in the repo; multiple environments (local, staging, production) must remain isolated.
- **Decision**: Check only `.env.local.example` into git, keep Convex secrets in the Convex dashboard (`npx convex env set`), and mirror required variables in docs.
- **Consequences**:
  - Safer collaboration with coding agents; context can be shared without leaking credentials.
  - Local scripts must fail fast when required env vars are missing (see runtime guards throughout `lib/integrations/*`).
