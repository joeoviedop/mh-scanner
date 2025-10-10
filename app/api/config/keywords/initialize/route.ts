import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../../convex/_generated/api";

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(url);
}

export const runtime = "nodejs";

export async function POST() {
  try {
    const convex = getConvexClient();
    const result = await convex.mutation(api.keywordConfig.initializeDefaultKeywords);

    return NextResponse.json({ 
      success: true, 
      message: `Initialized ${result.count} default keywords`,
      data: result 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize keywords";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
