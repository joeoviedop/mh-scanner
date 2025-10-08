import { NextResponse } from "next/server";

import {
  buildAuthCookie,
  getSessionToken,
  verifyPasscode,
} from "@/lib/auth";

type RateLimitState = {
  count: number;
  expiresAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const ATTEMPTS = new Map<string, RateLimitState>();

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return "unknown";
  }

  return forwardedFor.split(",")[0]?.trim() ?? "unknown";
}

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const state = ATTEMPTS.get(identifier);

  if (!state || state.expiresAt < now) {
    ATTEMPTS.set(identifier, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (state.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }

  state.count += 1;
  return false;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);

  if (isRateLimited(identifier)) {
    return NextResponse.json(
      {
        success: false,
        message: "Demasiados intentos. Intenta de nuevo en un minuto.",
      },
      {
        status: 429,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Solicitud inválida.",
      },
      {
        status: 400,
      },
    );
  }

  const passcode =
    typeof body === "object" && body !== null && "passcode" in body
      ? String((body as Record<string, unknown>).passcode ?? "")
      : "";

  if (!(await verifyPasscode(passcode))) {
    return NextResponse.json(
      {
        success: false,
        message: "Passcode incorrecto.",
      },
      {
        status: 401,
      },
    );
  }

  const token = await getSessionToken();
  const response = NextResponse.json({ success: true }, { status: 200 });
  const cookie = buildAuthCookie(token);

  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}