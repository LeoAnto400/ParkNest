import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Render authenticated pages per request.
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
