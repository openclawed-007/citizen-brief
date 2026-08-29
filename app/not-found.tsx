import Link from "next/link";

export default function NotFound() {
  return (
    <main className="article">
      <p className="eyebrow">Missing folio</p>
      <h1>This page is not in the current issue.</h1>
      <p className="lede">
        It may have moved when a new patch published. Start from the live briefing.
      </p>
      <div className="actions">
        <Link className="btn primary" href="/">
          Now
        </Link>
        <Link className="btn" href="/patches">
          Patches
        </Link>
        <Link className="btn" href="/news">
          Transmissions
        </Link>
      </div>
    </main>
  );
}
