export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface KeywordMatch {
  startTime: number;
  endTime: number;
  matchedText: string;
  contextText: string;
  matchedKeywords: string[];
}

const DIACRITIC_REGEX = /\p{Diacritic}/gu;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITIC_REGEX, "");
}

function collectKeywords(text: string, keywords: string[]): string[] {
  if (!text) return [];

  const normalizedText = normalize(text);
  const found = new Set<string>();

  for (const keyword of keywords) {
    const normalizedKeyword = normalize(keyword);
    if (normalizedKeyword && normalizedText.includes(normalizedKeyword)) {
      found.add(keyword);
    }
  }

  return Array.from(found).sort();
}

export interface KeywordDetectionOptions {
  windowSeconds?: number;
  maxMatches?: number;
}

export function detectKeywordMatches(
  segments: TranscriptSegment[],
  keywords: string[],
  options: KeywordDetectionOptions = {}
): KeywordMatch[] {
  if (!segments.length || !keywords.length) {
    return [];
  }

  const windowSeconds = options.windowSeconds ?? 45;
  const maxMatches = options.maxMatches ?? 25;
  const matches: KeywordMatch[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const matchedKeywords = collectKeywords(segment.text, keywords);

    if (matchedKeywords.length === 0) {
      continue;
    }

    const centerStart = segment.start;
    const windowStart = centerStart - windowSeconds;
    const windowEnd = segment.end + windowSeconds;

    const contextSegments: TranscriptSegment[] = [];

    for (let j = i; j >= 0; j -= 1) {
      const candidate = segments[j];
      if (candidate.end < windowStart) {
        break;
      }
      contextSegments.unshift(candidate);
    }

    for (let j = i + 1; j < segments.length; j += 1) {
      const candidate = segments[j];
      if (candidate.start > windowEnd) {
        break;
      }
      contextSegments.push(candidate);
    }

    const contextText = contextSegments.map((s) => s.text.trim()).join(" ").trim();
    const matchedText = segment.text.trim();

    matches.push({
      startTime: Math.max(0, centerStart - windowSeconds),
      endTime: segment.end + windowSeconds,
      matchedText,
      contextText: contextText || matchedText,
      matchedKeywords,
    });

    if (matches.length >= maxMatches) {
      break;
    }
  }

  return matches;
}
