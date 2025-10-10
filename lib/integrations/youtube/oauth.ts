type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
  }

  if (!clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
  }

  if (!refreshToken) {
    throw new Error("Missing GOOGLE_REFRESH_TOKEN environment variable");
  }

  return { clientId, clientSecret, refreshToken };
}

export async function getYouTubeAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getOAuthConfig();

  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.accessToken;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh OAuth token (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as TokenResponse;

  if (!data.access_token || !data.expires_in) {
    throw new Error("Invalid OAuth token response from Google");
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export function clearCachedAccessToken() {
  cachedToken = null;
}
