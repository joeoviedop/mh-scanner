import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

import DashboardPageClient from "./DashboardPageClient";

async function fetchChannels() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  const convex = new ConvexHttpClient(url);
  return convex.query(api.channels.list, { limit: 12 });
}

export const revalidate = 0;

export default async function DashboardPage() {
  const channels = await fetchChannels().catch(() => []);
  return <DashboardPageClient initialChannels={channels} />;
}
