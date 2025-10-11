import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function getClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(url);
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const episodeId =
    typeof payload === "object" && payload !== null && "episodeId" in payload
      ? String((payload as Record<string, unknown>).episodeId ?? "").trim()
      : "";

  const force =
    typeof payload === "object" && payload !== null && "force" in payload
      ? Boolean((payload as Record<string, unknown>).force)
      : false;

  if (!episodeId) {
    return NextResponse.json({ success: false, error: "episodeId is required" }, { status: 400 });
  }

  try {
    console.log("🎯 Starting mention detection API call for episode:", episodeId);
    
    const convex = getClient();
    const result = await convex.action(api.mentionActions.detectMentionsForEpisode, {
      episodeId: episodeId as Id<"episodes">,
      force,
    });

    console.log("✅ Mention detection API result:", result);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("❌ Mention detection API error:", message, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
