import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",            // enables static export (next build -> out/)
  // Optional, nice URLs with trailing slash on static hosts (S3, GitHub Pages, etc.)
  trailingSlash: true,
  // If you ever use next/image, add:
  images: { unoptimized: true },
  async rewrites() {
    return [
      // Proxy v1
      {
        source: "/api/v1/:path*",
        destination: "http://dev-gose.naraiseki.org/api/v1/:path*",
      },
      // Proxy v2
      {
        source: "/api/v2/:path*",
        destination: "http://dev-gose.naraiseki.org/api/v2/:path*",
      },
    ];
  },
};

export default nextConfig;
