const AUTH_COOKIE_NAME = "mh_scanner_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 horas

const encoder = new TextEncoder();

function getCrypto(): Crypto {
  if (!globalThis.crypto) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  return globalThis.crypto;
}

function getInternalPasscode(): string {
  const passcode = process.env.INTERNAL_PASSCODE;

  if (!passcode) {
    throw new Error("Missing INTERNAL_PASSCODE environment variable.");
  }

  return passcode;
}

async function sha256(value: string): Promise<Uint8Array> {
  const crypto = getCrypto();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = hex.slice(i * 2, i * 2 + 2);
    const parsed = Number.parseInt(byte, 16);

    if (Number.isNaN(parsed)) {
      throw new Error("Invalid hex character");
    }

    bytes[i] = parsed;
  }

  return bytes;
}

function timingSafeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

function getSessionBase(): string {
  return `${getInternalPasscode()}|${process.env.NODE_ENV ?? "development"}`;
}

function generateSalt(bytes = 16): string {
  const crypto = getCrypto();
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return bytesToHex(buffer);
}

export async function verifyPasscode(input: string): Promise<boolean> {
  if (!input) {
    return false;
  }

  const expected = await sha256(getInternalPasscode());
  const provided = await sha256(input);

  return timingSafeCompare(expected, provided);
}

export async function getSessionToken(): Promise<string> {
  const salt = generateSalt();
  const hashBytes = await sha256(`${getSessionBase()}|${salt}`);
  const hash = bytesToHex(hashBytes);
  return `${hash}.${salt}`;
}

export async function isSessionTokenValid(token?: string | null): Promise<boolean> {
  if (!token) {
    return false;
  }

  const [hash, salt] = token.split(".");

  if (!hash || !salt) {
    return false;
  }

  const expectedBytes = await sha256(`${getSessionBase()}|${salt}`);

  try {
    const providedBytes = hexToBytes(hash);
    return timingSafeCompare(providedBytes, expectedBytes);
  } catch {
    return false;
  }
}

export function buildAuthCookie(token: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    },
  };
}

export function buildClearAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 0,
      path: "/",
    },
  };
}

export { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };