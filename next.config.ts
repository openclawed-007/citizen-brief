import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const staticExport = process.env.STATIC_EXPORT !== "0";

const nextConfig: NextConfig = {
  output: staticExport ? "export" : "standalone",
  trailingSlash: true,
  poweredByHeader: false,
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
