import { mkdir, writeFile } from "node:fs/promises";
import { saveBriefCache, shouldBrief } from "../lib/brief";
import { getFeed, getPatchArticle, toPublicFeed } from "../lib/feed";

async function main() {
  process.env.HARVEST = "1";
  const fullFeed = await getFeed(true);
  const feed = toPublicFeed(fullFeed);
  await mkdir("public", { recursive: true });
  await writeFile("public/feed.json", JSON.stringify(feed));
  await writeFile("public/.nojekyll", "");

  let briefed = 0;
  for (let index = 0; index < fullFeed.patches.length; index += 1) {
    const patch = fullFeed.patches[index];
    if (!shouldBrief(index, patch.isLive)) continue;
    const article = await getPatchArticle(patch.version);
    if (article.brief) briefed += 1;
  }
  await saveBriefCache();

  console.log(
    `Harvested live ${feed.live.version} · ${feed.news.length} posts · ${feed.patches.length} patches · ${briefed} briefs`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
