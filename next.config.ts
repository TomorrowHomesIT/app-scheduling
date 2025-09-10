import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/** Turn this on/off to test Serwist in development - it's disabled by default */
const isTestSwEnabled = true;
const disableSerwist = !isTestSwEnabled && process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  disable: disableSerwist,
  swSrc: "src/app/service-worker/app-worker.ts",
  swDest: "public/sw.js",
  /** We disable this as we handle sync manually - it triggers location.reload() which doesn't suit our use case. */
  reloadOnOnline: false,
  cacheOnNavigation: true,
  additionalPrecacheEntries: [
    { url: "/", revision: null },
    { url: "/offline", revision: null },
  ],
});

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withSerwist(nextConfig);
