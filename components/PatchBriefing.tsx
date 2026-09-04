import type { BriefItem, PatchBrief } from "@/lib/types";

function BriefList({ title, items }: { title: string; items: BriefItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="brief-group">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            {item.detail ? <span>{item.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PatchBriefing({ brief }: { brief: PatchBrief }) {
  const hasDetails =
    brief.newContent.length + brief.fixes.length + brief.knownIssues.length + brief.whoItAffects.length + brief.watchouts.length >
    0;

  return (
    <section className="section brief-section" aria-labelledby="patch-brief-title">
      <div className="shell">
        <article className="brief-card">
          <div className="brief-card-head">
            <p className="eyebrow">Desk briefing</p>
            <h2 id="patch-brief-title">What this patch actually changes</h2>
            <p className="brief-headline">{brief.headline}</p>
          </div>
          <ol className="brief-takeaways">
            {brief.takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          {hasDetails ? (
            <details className="brief-details">
              <summary>Full organised notes</summary>
              <div className="brief-grid">
                <BriefList title="New and changed" items={brief.newContent} />
                <BriefList title="Fixes" items={brief.fixes} />
                <BriefList title="Known issues" items={brief.knownIssues} />
                {brief.whoItAffects.length > 0 ? (
                  <div className="brief-group">
                    <h3>Who it affects</h3>
                    <ul>
                      {brief.whoItAffects.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {brief.watchouts.length > 0 ? (
                  <div className="brief-group">
                    <h3>Watch outs</h3>
                    <ul>
                      {brief.watchouts.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}
          <p className="brief-note">Generated from the official notes. The full source is below.</p>
        </article>
      </div>
    </section>
  );
}
