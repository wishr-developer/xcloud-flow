import bundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Tree-shake icon imports so we only ship what's used.
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default withAnalyzer(nextConfig);
