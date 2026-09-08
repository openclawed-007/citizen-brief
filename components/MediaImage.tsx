"use client";

import { useState } from "react";

export function MediaImage({ src, alt = "", className, priority = false }: {
  src: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src || failedSource === src) {
    return (
      <span className={`ph image-placeholder ${className || ""}`} role={alt ? "img" : undefined} aria-label={alt ? `${alt} — image unavailable` : undefined} aria-hidden={alt ? undefined : true}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8" cy="8" r="1.5" />
          <path d="m3 17 5-5 4 4 4-6 5 7" />
        </svg>
        <span>Image unavailable</span>
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      ref={(image) => {
        // A cached failure can finish before hydration attaches onError.
        if (image?.complete && image.naturalWidth === 0) setFailedSource(src);
      }}
      onError={() => setFailedSource(src)}
    />
  );
}
