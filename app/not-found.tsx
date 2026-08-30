import Link from "next/link";

export default function NotFound() {
  return (
    <main className="article">
      <p className="eyebrow">Page not found</p>
      <h1>This page isn’t here anymore.</h1>
      <p className="lede">
        It may have moved when a new patch published. Start from the live briefing.
      </p>
      <div className="actions">
        <Link className="btn primary" href="/">
          Latest briefing
        </Link>
        <Link className="btn" href="/patches">
          Patches
        </Link>
        <Link className="btn" href="/news">
          News
        </Link>
      </div>
    </main>
  );
}
