/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server-only routes to be accessed during development if needed
  poweredByHeader: false,
  // Rewrites are used for the application routing; keep clean
  async rewrites() {
    return [];
  },
};

export default nextConfig;
