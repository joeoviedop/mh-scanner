import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function getClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(url);
}

function isValidFragmentId(value: string): value is Id<"fragments"> {
  return /^[a-z0-9]{32}$/i.test(value);
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.fragmentId !== "string" || typeof body.rating !== "string") {
    return NextResponse.json(
      { success: false, error: "fragmentId and rating are required" },
      { status: 400 },
    );
  }

  const { fragmentId, rating, comment, issues, relevanceScore, qualityScore, submittedBy } = body;

  if (!isValidFragmentId(fragmentId)) {
    return NextResponse.json(
      { success: false, error: "fragmentId is invalid" },
      { status: 400 },
    );
  }

  try {
    const convex = getClient();
    const result = await convex.mutation(api.feedback.submitFeedback, {
      fragmentId,
      rating,
      comment,
      issues,
      relevanceScore,
      qualityScore,
      submittedBy,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
