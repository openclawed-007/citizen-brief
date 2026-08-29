import type { Metadata } from "next";
import { NewsList } from "@/components/NewsViews";

export const metadata: Metadata = { title: "Official information" };

export default function NewsPage() {
  return <NewsList />;
}
