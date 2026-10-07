import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // "showup-shared" ships as TypeScript source (no build step) - this tells
  // Next.js's compiler to transpile it like it does apps/web's own code,
  // instead of expecting pre-built JS from node_modules.
  transpilePackages: ["showup-shared"],
};

// Gives `npm run dev` (plain `next dev`, not wrangler) access to the same
// Cloudflare bindings (KV, etc.) that the deployed Worker has, backed by a
// local Miniflare-simulated store on disk - so packages/shared/src/store.ts
// can call getCloudflareContext() everywhere and behave identically in dev
// and in production, instead of needing a separate in-memory-only dev path.
initOpenNextCloudflareForDev();

export default nextConfig;
