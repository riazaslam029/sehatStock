/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "postgres", "bcryptjs"],
  },
};

export default nextConfig;
