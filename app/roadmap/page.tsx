import type { Metadata } from "next";
import { RoadmapView } from "@/components/RoadmapBoard";

export const metadata: Metadata = { title: "Public roadmap" };

export default function RoadmapPage() {
  return <RoadmapView />;
}
