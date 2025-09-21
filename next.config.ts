import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { execSync } from "node:child_process";

/** Turn this on/off to test Serwist in development - it's disabled by default */
const isTestSwEnabled = false;
const disableSerwist = !isTestSwEnabled && process.env.NODE_ENV === "development";

const revision = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim().slice(0, 7);

const withSerwist = withSerwistInit({
  disable: disableSerwist,
  swSrc: "src/app/service-worker/app-worker.ts",
  swDest: "public/sw.js",
  /** We disable this as we handle sync manually - it triggers location.reload() which doesn't suit our use case. */
  reloadOnOnline: false,
  cacheOnNavigation: true,
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/jobs", revision },
    { url: "/offline", revision },
    { url: "/suppliers", revision },
    { url: "/manifest.json", revision },
  ],
});

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
