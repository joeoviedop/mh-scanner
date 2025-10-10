import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

function getClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(url);
}

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ episodeId: string }> }
) {
  const { episodeId: rawEpisodeId } = await context.params;
  const episodeId = rawEpisodeId?.trim();

  if (!episodeId) {
    return NextResponse.json({ success: false, error: "episodeId is required" }, { status: 400 });
  }

  try {
    const convex = getClient();
    const fragments = await convex.query(api.fragments.listByEpisode, {
      episodeId: episodeId as Id<"episodes">,
    });

    return NextResponse.json({ success: true, fragments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
