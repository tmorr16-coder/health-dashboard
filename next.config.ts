import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All traffic redirects to the hub — health is now at morrisai.family/health/
  async redirects() {
    return [
      { source: "/", destination: "https://morrisai.family/health", permanent: true },
      { source: "/dashboard", destination: "https://morrisai.family/health", permanent: true },
      { source: "/dashboard/:path*", destination: "https://morrisai.family/health/:path*", permanent: true },
      { source: "/:path*", destination: "https://morrisai.family/health/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // GitHub
      { protocol: "https", hostname: "media.licdn.com" },              // LinkedIn
    ],
  },
};

export default nextConfig;
