import { mkdir, writeFile } from "node:fs/promises";
import { getFeed } from "../lib/feed";

async function main() {
  process.env.HARVEST = "1";
  const feed = await getFeed(true);
  await mkdir("public", { recursive: true });
  await writeFile("public/feed.json", JSON.stringify(feed));
  await writeFile("public/.nojekyll", "");
  console.log(
    `Harvested live ${feed.live.version} · ${feed.news.length} posts · ${feed.patches.length} patches`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
