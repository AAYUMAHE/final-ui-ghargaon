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
    const isDev = process.env.NODE_ENV === "development";
    const defaultBackend = isDev
      ? "http://localhost:5000/api/:path*"
      : "https://api.ghargaon.in/api/:path*";

    return [
      {
        source: "/api/:path*",
        destination: process.env.BACKEND_API_URL
          ? `${process.env.BACKEND_API_URL}/:path*`
          : defaultBackend,
      },
    ];
  },
};

export default nextConfig;
