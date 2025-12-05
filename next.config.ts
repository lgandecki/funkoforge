import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "**.meshy.ai",
      },
      {
        protocol: "https",
        hostname: "assets.meshy.ai",
      },
    ],
  },
};

export default withBotId(nextConfig);
