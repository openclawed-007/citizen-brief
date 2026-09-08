import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import Script from "next/script";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { FeedProvider } from "@/components/FeedProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { emptyFeed, getFeed, toPublicFeed } from "@/lib/feed";
import "./globals.css";

const themeBoot = `(function(){var t;try{t=localStorage.getItem('cb-theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)})();`;

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
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
    feed = toPublicFeed(await getFeed());
  } catch {
    feed = emptyFeed();
  }
  try {
    const snapshot = JSON.parse(await readFile("public/feed.json", "utf8"));
    feed.ai = snapshot.ai;
  } catch { /* A local dev server may not have a harvested snapshot yet. */ }

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${bricolage.variable} ${ibm.variable}`}>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <FeedProvider initial={feed}>
          <Header />
          {children}
          <Footer />
        </FeedProvider>
      </body>
    </html>
  );
}
