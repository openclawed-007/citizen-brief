export default function Loading() {
  return (
    <main id="content" className="shell loading-view" aria-busy="true" aria-live="polite">
      <p className="eyebrow"><span className="live-pulse" /> Syncing official sources</p>
      <h1>Building your briefing</h1>
      <p className="lede">Checking the live build, roadmap, and latest news.</p>
      <div className="loading-grid" aria-hidden="true">
        <span /><span /><span />
      </div>
    </main>
  );
}
