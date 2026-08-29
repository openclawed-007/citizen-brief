import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatchArticleView } from "@/components/PatchViews";
import { getFeed, getPatchArticle } from "@/lib/feed";

type Props = { params: Promise<{ version: string }> };

export async function generateStaticParams() {
  const feed = await getFeed();
  return feed.patches.map((p) => ({ version: p.version }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;
  return { title: `Star Citizen Alpha ${version}` };
}

export default async function PatchPage({ params }: Props) {
  const { version } = await params;
  try {
    const article = await getPatchArticle(decodeURIComponent(version));
    return <PatchArticleView article={article} />;
  } catch {
    notFound();
  }
}
