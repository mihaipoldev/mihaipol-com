import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mihaipol-com.b-cdn.net",
      },
    ],
  },
};

export default nextConfig;
