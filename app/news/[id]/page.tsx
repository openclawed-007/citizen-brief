import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArticleView } from "@/components/NewsViews";
import { getFeed, getNewsArticle } from "@/lib/feed";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const feed = await getFeed();
  return feed.news.slice(0, 24).map((n) => ({ id: String(n.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getNewsArticle(Number(id));
  return { title: article?.title || "Transmission" };
}

export default async function NewsArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getNewsArticle(Number(id));
  if (!article) notFound();
  return <NewsArticleView article={article} />;
}
