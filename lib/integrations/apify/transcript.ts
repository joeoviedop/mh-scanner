const APIFY_API_BASE = "https://api.apify.com/v2";
const DEFAULT_ACTOR_ID = "pintostudio~youtube-transcript-scraper";

type ApifyRun = {
  id: string;
  status: string;
  defaultDatasetId?: string;
  outputDatasetId?: string;
};

type RawTranscriptSegment = {
  start?: number | string;
  end?: number | string;
  duration?: number | string;
  text?: string;
  startTime?: number | string;
  endTime?: number | string;
  startTimeMs?: number | string;
  durationMs?: number | string;
};

export type ApifyTranscript = {
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  debug: {
    runId: string;
    datasetId?: string;
    itemCount: number;
    actorId: string;
  };
};

function getApifyConfig() {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN environment variable is not set");
  }

  const actorId = process.env.APIFY_ACTOR_ID?.trim() || DEFAULT_ACTOR_ID;
  return { token, actorId };
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function startRun(actorId: string, token: string, input: Record<string, unknown>): Promise<ApifyRun> {
  const response = await fetch(`${APIFY_API_BASE}/acts/${actorId}/runs?token=${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to start Apify run (${response.status}): ${detail}`);
  }

  return (await response.json()) as ApifyRun;
}

async function getRun(runId: string, token: string): Promise<ApifyRun> {
  const response = await fetch(`${APIFY_API_BASE}/actor-runs/${runId}?token=${token}`);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch Apify run (${response.status}): ${detail}`);
  }

  return (await response.json()) as ApifyRun;
}

async function fetchDatasetItems(datasetId: string, token: string): Promise<unknown[]> {
  const url = new URL(`${APIFY_API_BASE}/datasets/${datasetId}/items`);
  url.searchParams.set("token", token);
  url.searchParams.set("clean", "1");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch Apify dataset (${response.status}): ${detail}`);
  }

  return (await response.json()) as unknown[];
}

function parseSeconds(value: number | string | undefined, fallback = 0): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    // Format HH:MM:SS.mmm or MM:SS.mmm
    const timeParts = trimmed.split(":");
    if (timeParts.length >= 2) {
      const seconds = parseFloat(timeParts.pop() ?? "0");
      const minutes = parseFloat(timeParts.pop() ?? "0");
      const hours = timeParts.length ? parseFloat(timeParts.pop() ?? "0") : 0;
      if (!Number.isNaN(seconds) && !Number.isNaN(minutes) && !Number.isNaN(hours)) {
        return hours * 3600 + minutes * 60 + seconds;
      }
    }

    const numeric = parseFloat(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }

  return fallback;
}

function normalizeSegments(items: unknown[]): ApifyTranscript["segments"] {
  const segments: ApifyTranscript["segments"] = [];

  const addSegment = (segment: RawTranscriptSegment) => {
    const start = parseSeconds(segment.start ?? segment.startTime ?? segment.startTimeMs, 0);
    let end = parseSeconds(segment.end ?? segment.endTime, start);
    if (end <= start) {
      const duration = parseSeconds(segment.duration ?? segment.durationMs, 0);
      if (duration > 0) {
        end = start + duration;
      }
    }

    const text = (segment.text ?? "").toString().replace(/\s+/g, " ").trim();
    if (!text) return;

    segments.push({ start, end, text });
  };

  items.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const record = item as Record<string, unknown>;

    if (Array.isArray(record.segments)) {
      record.segments.forEach((raw) => addSegment(raw as RawTranscriptSegment));
      return;
    }

    if (Array.isArray(record.transcript)) {
      record.transcript.forEach((raw) => addSegment(raw as RawTranscriptSegment));
      return;
    }

    if (
      record.text !== undefined &&
      (record.start !== undefined || record.startTime !== undefined || record.startTimeMs !== undefined)
    ) {
      addSegment(record as RawTranscriptSegment);
      return;
    }

    if (typeof record.text === "string" && !record.start && !record.startTime) {
      const text = record.text.trim();
      if (text) {
        segments.push({ start: 0, end: 0, text });
      }
    }
  });

  return segments.sort((a, b) => a.start - b.start);
}

export async function fetchTranscriptFromApify(videoId: string): Promise<ApifyTranscript | null> {
  const { token, actorId } = getApifyConfig();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const run = await startRun(actorId, token, { videoUrl });

  let currentRun = run;
  const maxAttempts = 15;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(currentRun.status)) {
      break;
    }

    await wait(2000);
    currentRun = await getRun(currentRun.id, token);
  }

  if (currentRun.status !== "SUCCEEDED") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[apify] run did not succeed", currentRun);
    }
    return null;
  }

  const datasetId = currentRun.defaultDatasetId || currentRun.outputDatasetId;
  if (!datasetId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[apify] run succeeded but datasetId missing", currentRun);
    }
    return null;
  }

  const items = await fetchDatasetItems(datasetId, token);
  const segments = normalizeSegments(items);

  if (!segments.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[apify] dataset returned no usable segments", items.slice(0, 3));
    }
    return null;
  }

  return {
    segments,
    debug: {
      runId: currentRun.id,
      datasetId,
      itemCount: segments.length,
      actorId,
    },
  };
}
