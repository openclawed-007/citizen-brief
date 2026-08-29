import type { Metadata } from "next";
import { PatchList } from "@/components/PatchViews";

export const metadata: Metadata = { title: "Patch notes" };

export default function PatchesPage() {
  return <PatchList />;
}
