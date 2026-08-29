import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import { FeedProvider } from "@/components/FeedProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { emptyFeed, getFeed } from "@/lib/feed";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const ibm = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Citizen Brief — Star Citizen live briefing",
    template: "%s · Citizen Brief",
  },
  description:
    "A live, auto-updating briefing for Star Citizen patches, the official public roadmap, and RSI transmissions.",
  metadataBase: new URL("https://openclawed-007.github.io/citizen-brief"),
  openGraph: {
    title: "Citizen Brief",
    description:
      "Live Star Citizen patches, roadmap, and official information — updated automatically.",
    type: "website",
  },
};

export const dynamic = "force-static";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let feed;
  try {
    feed = await getFeed();
  } catch {
    feed = emptyFeed();
  }

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${syne.variable} ${ibm.variable}`}>
        <FeedProvider initial={feed}>
          <Header />
          {children}
          <Footer />
        </FeedProvider>
      </body>
    </html>
  );
}
