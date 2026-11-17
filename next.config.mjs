import { withWorkflow } from "workflow/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
        ],
        source: "/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "mesonet.agron.iastate.edu",
        pathname: "/cgi-bin/wms/nexrad/n0q.cgi",
        protocol: "https",
      },
    ],
    unoptimized: true,
  },
  partialPrefetching: true,
  serverExternalPackages: ["nexrad-level-2-data"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withWorkflow(nextConfig);
