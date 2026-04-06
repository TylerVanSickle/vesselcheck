import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled because camera APIs (getUserMedia) break under StrictMode's
  // intentional double-invoke of effects — causes two <video> elements in dev.
  reactStrictMode: false,
};

export default nextConfig;
