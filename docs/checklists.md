# Checklists

Reuse these lists when spinning up the project, validating features, or prepping for demos/releases. Mark them off in issues or PR descriptions.

## Environment Setup
- [ ] Install Node ≥ 18.17.0 and npm ≥ 9.
- [ ] Copy `.env.local.example` → `.env.local` and fill `NEXT_PUBLIC_CONVEX_URL`.
- [ ] Install dependencies: `npm install`.
- [ ] Log into Convex (`npx convex login`) if you have not already.
- [ ] Set Convex environment variables: `npx convex env set YOUTUBE_API_KEY ...`, `npx convex env set APIFY_TOKEN ...`, `npx convex env set OPENAI_API_KEY ...`.
- [ ] Seed keyword config: `node scripts/initialize-keywords.js` (or the browser variant for manual tweaks).

## Daily Dev Loop
- [ ] `npm run dev` (Next.js) and `npm run convex:dev` running in parallel.
- [ ] Add a new channel/playlist via dashboard; confirm it appears with correct metadata.
- [ ] Trigger transcription for one episode; verify transcript and keyword highlights render.
- [ ] Run mention detection; check new fragments arrive with confidence scores.
- [ ] Leave feedback on a fragment; ensure UI refreshes and ranking adjusts.

## Static Guarantees Before PR
- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] (If scripts touched) `node scripts/test-openai.js` and/or `node scripts/test-apify.js`
- [ ] Update `docs/decisions.md` or `docs/pitfalls.md` when you learn something new.

## Smoke Test for Demos
- [ ] Create a fresh Convex deployment (or reset tables) to test onboarding from scratch.
- [ ] Re-run the full scanning pipeline on a known channel (e.g., VoyBien demo source).
- [ ] Spot-check long transcripts (>30 minutes) to ensure Apify pagination is still stable.
- [ ] Exercise passcode login, logout, and middleware redirect.
- [ ] Capture screenshots for the README `screenshots/` folder if UI changed.

## Release Prep
- [ ] `npm run build` and `npm run start` for production smoke locally.
- [ ] Confirm environment variables exist in hosting provider (Vercel/Convex prod).
- [ ] Review Convex dashboard for failing actions or stuck `scanJobs`.
- [ ] Update `README.md` with completed phases and link to any new docs.
- [ ] Tag release only after the above passes; attach QA notes and relevant metrics charts.
