import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "testnet1.helioschainlabs.org"
      },
      {
        protocol: "http",
        hostname: "testnet1.helioschainlabs.org",
        port: "8547"
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com"
      }
    ]
  }
}

export default nextConfig
