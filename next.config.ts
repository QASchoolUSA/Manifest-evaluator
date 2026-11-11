import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libSQL client is pure JS / wasm-friendly for Vercel Node runtime
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
