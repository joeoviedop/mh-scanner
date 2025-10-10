import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(url);
}

export const runtime = "nodejs";

// Get all keywords
export async function GET() {
  try {
    const convex = getConvexClient();
    const result = await convex.query(api.keywordConfig.getKeywords);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch keywords";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Add or update keyword
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json(
      { success: false, error: "Invalid payload format" },
      { status: 400 }
    );
  }

  const data = payload as Record<string, unknown>;

  // Determine if this is an update (has id) or new keyword
  const isUpdate = "id" in data && typeof data.id === "string";

  if (isUpdate) {
    // Update existing keyword
    const updateData: Record<string, unknown> & { id: Id<"keywordConfig"> } = { 
      id: data.id as Id<"keywordConfig"> 
    };

    if ("keyword" in data && typeof data.keyword === "string") {
      updateData.keyword = data.keyword;
    }
    if ("category" in data && typeof data.category === "string") {
      updateData.category = data.category;
    }
    if ("priority" in data && ["high", "medium", "low"].includes(data.priority as string)) {
      updateData.priority = data.priority;
    }
    if ("description" in data && typeof data.description === "string") {
      updateData.description = data.description;
    }
    if ("isActive" in data && typeof data.isActive === "boolean") {
      updateData.isActive = data.isActive;
    }

    try {
      const convex = getConvexClient();
      await convex.mutation(api.keywordConfig.updateKeyword, updateData);

      return NextResponse.json({ success: true, action: "updated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update keyword";
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  } else {
    // Add new keyword
    if (
      typeof data.keyword !== "string" ||
      typeof data.category !== "string" ||
      !["high", "medium", "low"].includes(data.priority as string)
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: keyword, category, priority" },
        { status: 400 }
      );
    }

    try {
      const convex = getConvexClient();
      const id = await convex.mutation(api.keywordConfig.addKeyword, {
        keyword: data.keyword,
        category: data.category,
        priority: data.priority as "high" | "medium" | "low",
        description: (data.description as string) || "",
        isActive: (data.isActive as boolean) ?? true,
      });

      return NextResponse.json({ success: true, action: "created", id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add keyword";
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  }
}

// Delete keyword
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Keyword ID is required" },
      { status: 400 }
    );
  }

  try {
    const convex = getConvexClient();
    await convex.mutation(api.keywordConfig.deleteKeyword, {
      id: id as Id<"keywordConfig">,
    });

    return NextResponse.json({ success: true, action: "deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete keyword";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
