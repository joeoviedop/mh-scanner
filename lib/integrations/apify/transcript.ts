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
  dur?: number | string;
  text?: string;
  startTime?: number | string;
  endTime?: number | string;
  startTimeMs?: number | string;
  durationMs?: number | string;
  endTimeMs?: number | string;
  startMs?: number | string;
  endMs?: number | string;
  startSeconds?: number | string;
  endSeconds?: number | string;
  durationSeconds?: number | string;
  caption?: string;
  transcriptText?: string;
  startSecond?: number | string;
  endSecond?: number | string;
  durationMilliseconds?: number | string;
  startMilliseconds?: number | string;
  endMilliseconds?: number | string;
  durMs?: number | string;
  offsetStartMs?: number | string;
  offsetEndMs?: number | string;
  offsetDurationMs?: number | string;
  time?: number | string;
  endTimeSeconds?: number | string;
  start_time?: number | string;
  end_time?: number | string;
  text_original?: string;
  text_clean?: string;
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
    runStatus: string;
    rawItemCount: number;
    rawSample: unknown[];
  };
};

function getApifyConfig() {
  // Support both APIFY_TOKEN and APIFY_API_TOKEN for backwards compatibility
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN or APIFY_API_TOKEN environment variable is not set");
  }

  const actorId = process.env.APIFY_ACTOR_ID?.trim() || DEFAULT_ACTOR_ID;
  
  // Log configuration in development for debugging
  if (process.env.NODE_ENV !== "production") {
    console.info("[apify] Using configuration:", {
      actorId,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + "..."
    });
  }
  
  return { token, actorId };
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function startRun(actorId: string, token: string, input: Record<string, unknown>): Promise<ApifyRun> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[apify] Starting run with:", {
      actorId,
      input,
      url: `${APIFY_API_BASE}/acts/${actorId}/runs`
    });
  }

  const response = await fetch(`${APIFY_API_BASE}/acts/${actorId}/runs?token=${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await response.text();
    const errorMsg = `Failed to start Apify run (${response.status}): ${detail}`;
    
    if (process.env.NODE_ENV !== "production") {
      console.error("[apify] Start run failed:", {
        status: response.status,
        detail,
        actorId,
        input
      });
    }
    
    throw new Error(errorMsg);
  }

  const responseData = await response.json();
  // Handle both wrapped and unwrapped response formats
  const result = (responseData.data || responseData) as ApifyRun;
  
  if (process.env.NODE_ENV !== "production") {
    console.info("[apify] Run started successfully:", {
      runId: result.id,
      status: result.status,
      datasetId: result.defaultDatasetId || result.outputDatasetId
    });
  }

  return result;
}

async function getRun(runId: string, token: string): Promise<ApifyRun> {
  const response = await fetch(`${APIFY_API_BASE}/actor-runs/${runId}?token=${token}`);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch Apify run (${response.status}): ${detail}`);
  }

  const responseData = await response.json();
  // Handle both wrapped and unwrapped response formats
  return (responseData.data || responseData) as ApifyRun;
}

async function fetchDatasetItems(datasetId: string, token: string): Promise<unknown[]> {
  const pageSize = Math.max(Number(process.env.APIFY_DATASET_PAGE_SIZE ?? "500"), 1);
  const maxItems = Math.max(Number(process.env.APIFY_DATASET_MAX_ITEMS ?? "10000"), pageSize);
  const allItems: unknown[] = [];

  for (let offset = 0; offset < maxItems; offset += pageSize) {
    const url = new URL(`${APIFY_API_BASE}/datasets/${datasetId}/items`);
    url.searchParams.set("token", token);
    url.searchParams.set("clean", "1");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));

    const response = await fetch(url.toString());
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Failed to fetch Apify dataset (${response.status}): ${detail}`);
    }

    const pageItems = (await response.json()) as unknown[];
    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      break;
    }

    allItems.push(...pageItems);

    if (pageItems.length < pageSize) {
      break;
    }
  }

  return allItems;
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

function parseNumber(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const normalized = trimmed.replace(/,/g, "");
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function parseMillisecondsToSeconds(value: number | string | undefined): number | null {
  const numeric = parseNumber(value);
  if (numeric === null) {
    return null;
  }

  return numeric / 1000;
}

function normalizeSegments(items: unknown[]): ApifyTranscript["segments"] {
  const segments: ApifyTranscript["segments"] = [];

  const addSegment = (segment: RawTranscriptSegment) => {
    const start =
      parseMillisecondsToSeconds(
        segment.startTimeMs ??
          segment.startMs ??
          segment.offsetStartMs ??
          segment.startMilliseconds ??
          segment.start_time,
      ) ??
      parseNumber(segment.startSeconds ?? segment.startSecond ?? segment.time) ??
      parseSeconds(segment.start ?? segment.startTime, 0);

    let end =
      parseMillisecondsToSeconds(
        segment.endTimeMs ??
          segment.endMs ??
          segment.offsetEndMs ??
          segment.endMilliseconds ??
          segment.end_time,
      ) ??
      parseNumber(segment.endSeconds ?? segment.endSecond ?? segment.endTimeSeconds) ??
      parseSeconds(segment.end ?? segment.endTime, start);

    if (end <= start) {
      const duration =
        parseMillisecondsToSeconds(
          segment.durationMs ?? segment.durationMilliseconds ?? segment.durMs ?? segment.offsetDurationMs,
        ) ??
        parseNumber(segment.durationSeconds ?? segment.dur ?? segment.duration) ??
        parseSeconds(segment.duration, 0);
      if (duration > 0) {
        end = start + duration;
      }
    }

    const textSource =
      segment.text ??
      segment.transcriptText ??
      segment.caption ??
      segment.text_original ??
      segment.text_clean;
    const text = (textSource ?? "").toString().replace(/\s+/g, " ").trim();
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

    if (record.transcript && typeof record.transcript === "object") {
      const nested = record.transcript as Record<string, unknown>;
      if (Array.isArray(nested.segments)) {
        nested.segments.forEach((raw) => addSegment(raw as RawTranscriptSegment));
        return;
      }
    }

    if (typeof record.transcript === "string") {
      const text = record.transcript.trim();
      if (text) {
        segments.push({ start: 0, end: 0, text });
      }
      return;
    }

    const transcriptSegments = (record as Record<string, unknown>).transcriptSegments;
    if (Array.isArray(transcriptSegments)) {
      transcriptSegments.forEach((raw) => addSegment(raw as RawTranscriptSegment));
      return;
    }

    if (Array.isArray(record.data)) {
      record.data.forEach((raw) => addSegment(raw as RawTranscriptSegment));
      return;
    }

    const results = (record as Record<string, unknown>).results;
    if (Array.isArray(results)) {
      results.forEach((raw) => addSegment(raw as RawTranscriptSegment));
      return;
    }

    const captions = (record as Record<string, unknown>).captions;
    if (Array.isArray(captions)) {
      captions.forEach((raw) => addSegment(raw as RawTranscriptSegment));
      return;
    }

    const itemsCollection = (record as Record<string, unknown>).items;
    if (Array.isArray(itemsCollection)) {
      itemsCollection.forEach((raw) => addSegment(raw as RawTranscriptSegment));
      return;
    }

    const entries = (record as Record<string, unknown>).entries;
    if (Array.isArray(entries)) {
      entries.forEach((raw) => addSegment(raw as RawTranscriptSegment));
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
  try {
    const { token, actorId } = getApifyConfig();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    if (process.env.NODE_ENV !== "production") {
      console.info("[apify] Fetching transcript for:", { videoId, videoUrl });
    }

    const run = await startRun(actorId, token, { videoUrl });

  let currentRun = run;
  let datasetId = run.defaultDatasetId || run.outputDatasetId;
  const pollIntervalMs = Math.max(Number(process.env.APIFY_POLL_INTERVAL_MS ?? "3000"), 1000);
  const maxAttempts = Math.max(Number(process.env.APIFY_MAX_POLL_ATTEMPTS ?? "60"), 1);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(currentRun.status)) {
      break;
    }

    await wait(pollIntervalMs);
    currentRun = await getRun(currentRun.id, token);
    datasetId = datasetId || currentRun.defaultDatasetId || currentRun.outputDatasetId;
  }

  datasetId = datasetId || currentRun.defaultDatasetId || currentRun.outputDatasetId;
  if (!datasetId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[apify] run succeeded but datasetId missing", currentRun);
    }
    return null;
  }

  const items = await fetchDatasetItems(datasetId, token);
  const segments = normalizeSegments(items);
  const rawSample = items.slice(0, 5);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[apify] dataset fetched", {
      runId: currentRun.id,
      status: currentRun.status,
      datasetId,
      totalItems: items.length,
      segments: segments.length,
    });
  }

  return {
    segments,
    debug: {
      runId: currentRun.id,
      datasetId,
      itemCount: segments.length,
      actorId,
      runStatus: currentRun.status,
      rawItemCount: items.length,
      rawSample,
    },
  };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[apify] Failed to fetch transcript:", {
        videoId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    throw error;
  }
}
