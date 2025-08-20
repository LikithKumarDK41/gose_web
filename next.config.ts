import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",            // enables static export (next build -> out/)
  // Optional, nice URLs with trailing slash on static hosts (S3, GitHub Pages, etc.)
  trailingSlash: true,
  // If you ever use next/image, add:
  images: { unoptimized: true },
};

export default nextConfig;
