import { excerpt } from "./format";

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripNestedTemplates(input: string): string {
  let s = input;
  for (let i = 0; i < 8; i += 1) {
    const next = s.replace(/\{\{[^{}]*\}\}/g, (m) => {
      const rsi = m.match(/\{\{\s*Link RSI\s*\|[^}]*\}\}/i);
      if (rsi) {
        const url = m.match(/\|\s*url\s*=\s*([^|}]+)/i)?.[1]?.trim() || "";
        const text = m.match(/\|\s*text\s*=\s*([^|}]+)/i)?.[1]?.trim() || url;
        const href = url.startsWith("http")
          ? url
          : `https://robertsspaceindustries.com/${url.replace(/^\//, "")}`;
        return `[${text}](${href})`;
      }
      if (/\{\{\s*Cite RSI\s*\|/i.test(m)) return "";
      return "";
    });
    if (next === s) break;
    s = next;
  }
  return s;
}

function wikiHref(page: string): string {
  const title = page.replace(/ /g, "_").replace(/#/g, " ");
  return `https://starcitizen.tools/${encodeURI(title)}`;
}

function stashHtml(slots: string[], html: string): string {
  const i = slots.length;
  slots.push(html);
  return `\u0000${i}\u0000`;
}

export function inlineFormat(plain: string): string {
  const slots: string[] = [];
  let s = plain.replace(/\[\[File:[^\]]+\]\]/gi, "");
  s = s.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?\|([^\]]+)\]\]/g, (_, p, l) =>
    stashHtml(
      slots,
      `<a href="${escapeHtml(wikiHref(p.trim()))}" target="_blank" rel="noreferrer">${escapeHtml(l.trim())}</a>`,
    ),
  );
  s = s.replace(/\[\[([^\]|#]+)(?:#[^\]]*)?\]\]/g, (_, p) =>
    stashHtml(
      slots,
      `<a href="${escapeHtml(wikiHref(p.trim()))}" target="_blank" rel="noreferrer">${escapeHtml(p.trim())}</a>`,
    ),
  );
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, text, url) =>
    stashHtml(
      slots,
      `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`,
    ),
  );
  s = s.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, (_, url, label) =>
    stashHtml(
      slots,
      `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`,
    ),
  );
  s = escapeHtml(s);
  s = s.replace(/'''(.+?)'''/g, "<strong>$1</strong>");
  s = s.replace(/''(.+?)''/g, "<em>$1</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[Number(i)] || "");
  return s;
}

export function extractPatchMeta(wikitext: string): {
  build: string;
  prev: string;
  next: string;
  publishDate: string;
  version: string;
  headline: string;
  summary: string;
  rsiPatchUrl: string | null;
  rsiAnnounceUrl: string | null;
} {
  const get = (key: string) =>
    wikitext.match(new RegExp(`\\|\\s*${key}\\s*=\\s*(.*)`, "i"))?.[1]?.trim() || "";

  const headlineMatch = wikitext.match(/'''Star Citizen Alpha [0-9.]+[^']*'''/i);
  const headline = headlineMatch
    ? decodeEntities(headlineMatch[0].replace(/'''/g, "")).replace(/\s+/g, " ").trim()
    : "";

  const firstPara = wikitext
    .replace(/\{\{PatchData[\s\S]*?\n\}\}/, "")
    .replace(/<ref[\s\S]*?<\/ref>/gi, "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("=") && !l.startsWith("|") && !l.startsWith("{") && !l.startsWith("*"));

  let rsiPatchUrl: string | null = null;
  let rsiAnnounceUrl: string | null = null;
  const linkRe = /\{\{\s*Link RSI\s*\|([^}]+)\}\}/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(wikitext))) {
    const body = m[1];
    const url =
      body.match(/\|\s*url\s*=\s*([^|]+)/i)?.[1]?.trim() ||
      body.match(/url=([^|]+)/i)?.[1]?.trim() ||
      "";
    const text = body.match(/\|\s*text\s*=\s*([^|]+)/i)?.[1]?.trim() || "";
    const href = url.startsWith("http")
      ? url
      : `https://robertsspaceindustries.com/${url.replace(/^\//, "")}`;
    if (/patch notes/i.test(text) || /Patch-Notes/i.test(url)) rsiPatchUrl = href;
    else if (!rsiAnnounceUrl && /Alpha|Siege|announcement/i.test(text + url)) rsiAnnounceUrl = href;
  }

  return {
    build: get("buildnumber"),
    prev: get("Prev").replace(/\[\[|\]\]/g, ""),
    next: get("Next").replace(/\[\[|\]\]/g, ""),
    publishDate: get("publishdate"),
    version: get("version"),
    headline,
    summary: excerpt(
      decodeEntities(
        stripNestedTemplates(
          (firstPara || "").replace(/'''/g, "").replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2"),
        ),
      ),
      320,
    ),
    rsiPatchUrl,
    rsiAnnounceUrl,
  };
}

export function wikiToHtml(wikitext: string): string {
  let source = wikitext.replace(/\r\n/g, "\n");
  const notesAt = source.search(/^==\s*Patch notes\s*==/im);
  if (notesAt >= 0) source = source.slice(notesAt);

  source = source.replace(/<ref[\s\S]*?<\/ref>/gi, "");
  source = source.replace(/<ref[^>]*\/?>/gi, "");
  source = source.replace(/<gallery[\s\S]*?<\/gallery>/gi, "");
  source = stripNestedTemplates(source);
  source = source.replace(/\{\|[\s\S]*?\|\}/g, "");

  const lines = source.split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/^\s+/, "");
    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^(={2,4})\s*(.+?)\s*\1\s*$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const text = heading[2].replace(/'''/g, "");
      html.push(`<h${level}>${inlineFormat(text)}</h${level}>`);
      continue;
    }

    if (/^----+$/.test(line)) {
      closeList();
      html.push("<hr />");
      continue;
    }

    const ul = line.match(/^\*\s*(.*)$/);
    if (ul) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^#\s*(.*)$/);
    if (ol) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineFormat(line)}</p>`);
  }
  closeList();

  return html.join("\n");
}

export function plainToHtml(text: string): string {
  const cleaned = decodeEntities(text).replace(/\r\n/g, "\n").trim();
  if (!cleaned) return "<p>No transcript is available for this transmission yet.</p>";
  const blocks = cleaned.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return "";
      if (
        lines.length === 1 &&
        lines[0].length < 80 &&
        /[A-Z]/.test(lines[0]) &&
        lines[0] === lines[0].toUpperCase()
      ) {
        return `<h3>${escapeHtml(lines[0])}</h3>`;
      }
      const withBreaks = lines.map((l) => inlineFormat(l)).join("<br />");
      return `<p>${withBreaks}</p>`;
    })
    .join("\n");
}

export function htmlLooksBroken(html: string): string[] {
  const issues: string[] = [];
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  if (/target="_blank"/.test(text) || /rel="noreferrer"/.test(text)) {
    issues.push("raw target=_blank leaked into visible text");
  }
  if (/\[\[.+\]\]/.test(html)) {
    issues.push("unparsed wiki link brackets remain");
  }
  const opens = (html.match(/<a\b/gi) || []).length;
  const closes = (html.match(/<\/a>/gi) || []).length;
  if (opens !== closes) {
    issues.push(`unbalanced anchors (${opens} open, ${closes} close)`);
  }
  return issues;
}
