import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.BACKEND_API_URL
          ? `${process.env.BACKEND_API_URL}/:path*`
          : "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
