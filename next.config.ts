import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
