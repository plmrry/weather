import { withWorkflow } from "workflow/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
        ],
        source: "/:path*",
      },
    ];
  },
  partialPrefetching: true,
  serverExternalPackages: ["nexrad-level-2-data"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withWorkflow(nextConfig);
