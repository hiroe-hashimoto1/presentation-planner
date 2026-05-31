import type { NextConfig } from "next";

const isSurgeBuild = process.env.SURGE_DEPLOY === "1";

const nextConfig: NextConfig = {
  // Surge: 静的 export（out/） / Vercel: ネイティブ Next.js ビルド
  ...(isSurgeBuild ? { output: "export" as const } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
