import Link from "next/link";

export default function NotFound() {
  return (
    <main className="article">
      <div className="kicker">Signal lost</div>
      <h1>This briefing does not exist</h1>
      <p className="lede">
        The page you requested is not in the live desk. It may have been renamed when
        a new patch published.
      </p>
      <div className="actions">
        <Link className="btn primary" href="/">
          Return to briefing
        </Link>
        <Link className="btn ghost" href="/news">
          Official posts
        </Link>
      </div>
    </main>
  );
}
