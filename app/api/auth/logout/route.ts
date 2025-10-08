import { NextResponse } from "next/server";

import { buildClearAuthCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  const cookie = buildClearAuthCookie();

  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}