import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { getPatchArticle } from "../lib/feed";
import { htmlLooksBroken, inlineFormat, wikiToHtml } from "../lib/wiki";
import { rankSearch, type SearchCandidate } from "../lib/search";

const issues: string[] = [];
const ok: string[] = [];

function assert(cond: boolean, pass: string, fail: string) {
  if (cond) ok.push(pass);
  else issues.push(fail);
}

async function walkHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkHtml(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

async function main() {
  const sample =
    `==== Siege of Orison V2 ====\n` +
    `[[Siege of Orison]] returns as our first [[Instancing]] on Demand mission. ` +
    `The CDF is recruiting players to break the [[Nine Tails]]' grip.\n` +
    `See [https://robertsspaceindustries.com/comm-link/foo Official notes].\n`;

  const converted = wikiToHtml(sample);
  const inline = inlineFormat("[[Siege of Orison]] and [[Instancing|instances]]");
  const wikiIssues = htmlLooksBroken(converted).concat(htmlLooksBroken(inline));

  assert(
    wikiIssues.length === 0,
    "Wiki converter emits balanced, clean HTML",
    `Wiki converter still broken: ${wikiIssues.join("; ")}`,
  );
  assert(
    /<a href="https:\/\/starcitizen\.tools\/Siege_of_Orison"[^>]*>Siege of Orison<\/a>/.test(inline),
    "Wiki links become proper anchors",
    `Wiki link HTML is wrong: ${inline}`,
  );
  const visibleConverted = (converted + inline).replace(/<[^>]+>/g, " ");
  assert(
    !/target="_blank"/.test(visibleConverted),
    "No leaked target=_blank in visible text",
    "Leaked target=_blank still present in converter output",
  );
  assert(!/\[\[[^\]]+\]\]/.test(visibleConverted), "No leftover [[wiki]] brackets", "Leftover wiki brackets in HTML");

  const searchFixtures: (SearchCandidate & { id: string })[] = [
    { id: "patch", title: "Alpha 4.10 patch notes", searchText: "live build release", keywords: "patch update", priority: 5 },
    { id: "status", title: "Universe operational", searchText: "platform service", keywords: "server status outage", priority: 4 },
    { id: "ship", title: "Drake Ironclad", searchText: "cargo spacecraft", keywords: "ship vehicle", priority: 3 },
  ];
  assert(
    rankSearch(searchFixtures, "ptach")[0]?.id === "patch",
    "Smart search tolerates likely typing mistakes",
    "Smart search did not relate 'ptach' to patch notes",
  );
  assert(
    rankSearch(searchFixtures, "server")[0]?.id === "status",
    "Smart search understands status intent",
    "Smart search did not relate 'server' to universe status",
  );
  assert(
    rankSearch(searchFixtures, "cargo ship")[0]?.id === "ship",
    "Smart search ranks multi-word intent",
    "Smart search did not rank the matching ship",
  );
  assert(
    rankSearch(searchFixtures, "zzzzzz").length > 0,
    "Smart search always offers useful fallbacks",
    "Smart search rendered an empty suggestion list",
  );

  const browserProvider = await readFile(
    join(process.cwd(), "components", "FeedProvider.tsx"),
    "utf8",
  );
  assert(
    browserProvider.includes("/feed.json") &&
      !browserProvider.includes("fetchCommLinks") &&
      !browserProvider.includes("fetchGameVersions"),
    "Open tabs only revalidate the deployed feed",
    "Browser refresh code can still contact upstream APIs per visitor",
  );

  process.env.HARVEST = "1";
  const article = await getPatchArticle("4.10.0");
  const liveIssues = htmlLooksBroken(article.html);
  assert(
    liveIssues.length === 0,
    "Live 4.10.0 patch notes HTML is clean",
    `4.10.0 notes broken: ${liveIssues.join("; ")}\nSample: ${article.html.slice(0, 400)}`,
  );
  const visibleNotes = article.html.replace(/<[^>]+>/g, " ");
  assert(
    article.html.includes("Siege of Orison") &&
      !/target="_blank"/.test(visibleNotes) &&
      !/starcitizen\.tools\/Siege_of_Orison"/.test(visibleNotes),
    "Siege of Orison renders as a link, not raw attributes",
    "Siege of Orison still shows raw href/target text",
  );

  const outDir = join(process.cwd(), "out");
  let pages: string[] = [];
  try {
    await stat(outDir);
    pages = await walkHtml(outDir);
  } catch {
    issues.push("out/ is missing — run npm run build before the crawl checks");
  }

  if (pages.length) {
    assert(pages.length >= 8, `Exported ${pages.length} HTML pages`, "Too few exported pages");
    const home = await readFile(join(outDir, "index.html"), "utf8");
    assert(home.includes("feature-entry") || home.includes("feature-hero"), "Home includes designed feature stills", "Home is missing feature image layout");
    assert(home.includes("search-launch") || home.includes("Search"), "Search control is present", "Search control missing from home");
    assert(home.includes("Switch to dark mode") || home.includes("Dark") || home.includes("theme"), "Dark mode toggle is present", "Dark mode toggle missing");

    const exportedFeed = JSON.parse(await readFile(join(outDir, "feed.json"), "utf8")) as {
      news: { id: number }[];
      patches: { version: string }[];
    };
    const expectedRoutes = [
      ...exportedFeed.news.map((item) => `news/${item.id}/index.html`),
      ...exportedFeed.patches.map((patch) => `patches/${patch.version}/index.html`),
    ];
    const missingRoutes: string[] = [];
    await Promise.all(
      expectedRoutes.map(async (route) => {
        try {
          await stat(join(outDir, route));
        } catch {
          missingRoutes.push(route);
        }
      }),
    );
    assert(
      missingRoutes.length === 0,
      `Every feed item has an exported destination (${expectedRoutes.length} routes)`,
      `Feed contains dead internal routes: ${missingRoutes.join(", ")}`,
    );

    for (const page of pages) {
      const html = await readFile(page, "utf8");
      const rel = page.replace(process.cwd() + "/", "");
      const visible = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ");
      if (/target="_blank"/.test(visible) || /rel="noreferrer"/.test(visible)) {
        issues.push(`Broken link attributes in ${rel}`);
      }
      if (/\[\[[A-Za-z][^\]]{2,80}\]\]/.test(visible)) {
        issues.push(`Unparsed wiki brackets in ${rel}`);
      }
      if (!html.includes("<h1") && !rel.includes("404")) issues.push(`No h1 in ${rel}`);
    }

    const notesPath = pages.find((p) => p.includes("patches/4.10.0"));
    if (notesPath) {
      const notes = await readFile(notesPath, "utf8");
      assert(
        notes.includes("<a href=\"https://starcitizen.tools/") && notes.includes("Siege of Orison"),
        "4.10.0 page contains proper wiki anchors",
        "4.10.0 page is missing proper Siege of Orison link",
      );
      assert(notes.includes("<img") || notes.includes("feature-entry"), "4.10.0 page includes feature images", "4.10.0 page has no feature images");
    } else {
      issues.push("Could not find exported 4.10.0 patch page");
    }
  }

  console.log(`\nCitizen Brief tests: ${ok.length} passed, ${issues.length} failed\n`);
  for (const line of ok) console.log(`  ok  ${line}`);
  for (const line of issues) console.log(`  FAIL  ${line}`);
  if (issues.length) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
