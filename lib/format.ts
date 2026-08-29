const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function versionFromCode(code: string): string {
  return (code.split("-")[0] || code).trim();
}

export function formatDate(input: string | number | null | undefined): string {
  if (input == null || input === "") return "";
  const date =
    typeof input === "number"
      ? new Date(input > 10_000_000_000 ? input : input * 1000)
      : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateTime(input: string | number | null | undefined): string {
  if (input == null || input === "") return "";
  const date =
    typeof input === "number"
      ? new Date(input > 10_000_000_000 ? input : input * 1000)
      : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(date.toISOString())} · ${hh}:${mm} UTC`;
}

export function relativeTime(input: string | number | null | undefined): string {
  if (input == null || input === "") return "";
  const date =
    typeof input === "number"
      ? new Date(input > 10_000_000_000 ? input : input * 1000)
      : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day}d ago`;
  return formatDate(date.toISOString());
}

export function formatMoney(cents: number | null): string {
  if (cents == null) return "—";
  const usd = cents / 100;
  if (usd >= 1_000_000_000) {
    return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  }
  if (usd >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(1)}M`;
  }
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatNumber(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function rsiMedia(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://robertsspaceindustries.com${url}`;
  return `https://robertsspaceindustries.com/${url}`;
}

export function excerpt(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function statusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "operational" || s === "ok") return "Operational";
  if (s.includes("disrupt")) return "Degraded";
  if (s.includes("down") || s.includes("outage") || s.includes("major")) return "Outage";
  if (s.includes("maintenance")) return "Maintenance";
  return status.replace(/_/g, " ");
}

export function statusTone(status: string): "ok" | "warn" | "bad" | "idle" {
  const s = status.toLowerCase();
  if (s === "operational" || s === "ok" || s === "released" || s === "committed") return "ok";
  if (s.includes("disrupt") || s === "tentative" || s.includes("maintenance")) return "warn";
  if (s.includes("down") || s.includes("outage") || s.includes("major")) return "bad";
  return "idle";
}

export function kindLabel(kind: string): string {
  switch (kind) {
    case "patch":
      return "Patch";
    case "roadmap":
      return "Roadmap";
    case "weekly":
      return "This Week";
    case "monthly":
      return "Monthly";
    case "chairman":
      return "Chairman";
    case "ship":
      return "Ships";
    case "transmission":
      return "Transmission";
    default:
      return "Official";
  }
}
