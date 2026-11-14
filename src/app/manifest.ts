import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#0b1220",
    description:
      "Live NOAA / NWS Level II radar data by latitude and longitude.",
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    name: "NEXRAD Radar Explorer",
    short_name: "NEXRAD",
    start_url: "/",
    theme_color: "#0b1220",
  };
}
