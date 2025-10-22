import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import { parseYouTubeUrl } from "@/lib/integrations/youtube/youtube-parser";

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(url);
}

const VALID_FREQUENCIES = new Set(["daily", "weekly", "manual"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const youtubeUrl =
    typeof payload === "object" && payload !== null && "youtubeUrl" in payload
      ? String((payload as Record<string, unknown>).youtubeUrl ?? "").trim()
      : "";

  const scanFrequency =
    typeof payload === "object" && payload !== null && "scanFrequency" in payload
      ? String((payload as Record<string, unknown>).scanFrequency ?? "").trim()
      : "";

  if (!youtubeUrl) {
    return NextResponse.json({ success: false, error: "youtubeUrl is required" }, { status: 400 });
  }

  if (!VALID_FREQUENCIES.has(scanFrequency)) {
    return NextResponse.json({ success: false, error: "Invalid scanFrequency" }, { status: 400 });
  }

  const parsed = parseYouTubeUrl(youtubeUrl);

  if (!parsed) {
    return NextResponse.json({ success: false, error: "Unsupported YouTube URL" }, { status: 400 });
  }

  const frequency = scanFrequency as "daily" | "weekly" | "manual";

  try {
    const convex = getConvexClient();
    const summary = await convex.action(api.channelActions.scanSource, {
      parsed,
      scanFrequency: frequency,
      requestedBy: "dashboard",
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start scan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
