import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

import EpisodesPageClient from "./EpisodesPageClient";

async function fetchEpisodes() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  const convex = new ConvexHttpClient(url);
  return convex.query(api.episodes.list, { limit: 50 });
}

export const revalidate = 0;

export default async function EpisodesPage() {
  const episodes = await fetchEpisodes().catch(() => []);
  return <EpisodesPageClient initialEpisodes={episodes} />;
}
