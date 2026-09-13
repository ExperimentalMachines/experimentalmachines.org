import type { NextConfig } from "next";

// Static export for GitHub Pages: every route becomes a directory with an
// index.html, and images are served as committed files.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
