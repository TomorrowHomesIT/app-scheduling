import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { execSync } from "node:child_process";

/** Turn this on/off to test Serwist in development - it's disabled by default */
const isTestSwEnabled = true;
const disableSerwist = !isTestSwEnabled && process.env.NODE_ENV === "development";

const revision = null;

const withSerwist = withSerwistInit({
  disable: disableSerwist,
  swSrc: "src/app/service-worker/app-worker.ts",
  swDest: "public/sw.js",
  /** We disable this as we handle sync manually - it triggers location.reload() which doesn't suit our use case. */
  reloadOnOnline: false,
  cacheOnNavigation: true,
  // Preload ALL static assets and routes
  additionalPrecacheEntries: [
    // All your static routes
    { url: "/", revision },
    { url: "/auth/login/", revision },
    { url: "/404/", revision },
    { url: "/job/", revision },
    { url: "/jobs/", revision },
    { url: "/suppliers/", revision },
    { url: "/offline", revision },
    { url: "/offline/", revision },
    { url: "/manifest.json", revision },
    { url: "/icon-192x192.png", revision }
  ],
  // Configure to include all JS chunks
  include: [/\.(?:js|css|html|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot)$/],
  // Exclude source maps and other dev files
  exclude: [/\.map$/, /manifest$/, /\.DS_Store$/, /^.*\.d\.ts$/],
});

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
};

export default withSerwist(nextConfig);
