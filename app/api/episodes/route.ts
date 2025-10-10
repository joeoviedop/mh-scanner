import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../convex/_generated/api";

function getClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(url);
}

export const runtime = "nodejs";

export async function GET() {
  try {
    const convex = getClient();
    const episodes = await convex.query(api.episodes.list, { limit: 50 });
    return NextResponse.json({ success: true, episodes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load episodes";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
