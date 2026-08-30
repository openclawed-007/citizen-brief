export type SearchCandidate = {
  title: string;
  searchText: string;
  keywords?: string;
  priority: number;
};

const INTENTS: Record<string, string[]> = {
  latest: ["new", "recent", "today", "news", "official"],
  news: ["announcement", "commlink", "official", "transmission", "latest"],
  patch: ["update", "build", "release", "hotfix", "notes", "live"],
  server: ["status", "universe", "outage", "maintenance", "service"],
  ship: ["vehicle", "spacecraft", "fighter", "cargo"],
  roadmap: ["upcoming", "future", "planned", "release", "next"],
  next: ["upcoming", "roadmap", "planned", "future"],
};

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function tokenScore(token: string, words: string[]): number {
  if (words.includes(token)) return 34;
  if (words.some((word) => word.startsWith(token))) return 24;
  if (token.length >= 3 && words.some((word) => word.includes(token))) return 15;
  if (token.length < 3) return 0;

  const allowedDistance = token.length >= 5 ? 2 : 1;
  const distance = words.reduce(
    (best, word) => Math.min(best, editDistance(token, word)),
    Number.POSITIVE_INFINITY,
  );
  return distance <= allowedDistance ? 13 - distance * 3 : 0;
}

function scoreCandidate(candidate: SearchCandidate, query: string): number {
  const title = normalizeSearch(candidate.title);
  const haystack = normalizeSearch(
    `${candidate.title} ${candidate.searchText} ${candidate.keywords || ""}`,
  );
  const words = [...new Set(haystack.split(" ").filter(Boolean))];
  const tokens = normalizeSearch(query).split(" ").filter(Boolean);
  if (!tokens.length) return candidate.priority;

  if (tokens.length === 1 && tokens[0].length === 1) {
    return words.some((word) => word.startsWith(tokens[0])) ? 20 + candidate.priority : 0;
  }

  let score = candidate.priority;
  const normalizedQuery = tokens.join(" ");
  if (title === normalizedQuery) score += 140;
  else if (title.startsWith(normalizedQuery)) score += 100;
  else if (title.includes(normalizedQuery)) score += 75;
  else if (haystack.includes(normalizedQuery)) score += 48;

  let matchedTokens = 0;
  for (const token of tokens) {
    const directScore = tokenScore(token, words);
    const intentScore = (INTENTS[token] || []).some((intent) => words.includes(intent)) ? 16 : 0;
    const best = Math.max(directScore, intentScore);
    if (best > 0) matchedTokens += 1;
    score += best;
  }

  if (matchedTokens === 0) return 0;
  if (matchedTokens === tokens.length) score += 22;
  else if (tokens.length > 1 && matchedTokens / tokens.length < 0.5) return 0;
  return score;
}

export function rankSearch<T extends SearchCandidate>(
  candidates: T[],
  query: string,
  limit = 12,
): T[] {
  const scored = candidates.map((candidate, index) => ({
    candidate,
    index,
    score: scoreCandidate(candidate, query),
  }));
  const matches = scored.filter((entry) => entry.score > 0);
  const pool = matches.length
    ? matches
    : scored.map((entry) => ({ ...entry, score: entry.candidate.priority }));

  return pool
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
