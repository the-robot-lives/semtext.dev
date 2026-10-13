import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  // Snapshot harness (scripts/snap) runs its managed dev server with a private
  // distDir so it never races other lanes' dev servers on .next/. Default
  // unchanged for every other invocation.
  distDir: process.env.SNAP_NEXT_DIST_DIR || ".next",
  images: { unoptimized: true },
  // Directory URLs (/reference/ -> out/reference/index.html) so the static
  // export serves from any dumb file server.
  trailingSlash: true,
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
