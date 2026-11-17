import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#0b1220",
    description: "Live weather data.",
    display: "standalone",
    name: "Weather Café",
    short_name: "Weather Café",
    start_url: "/",
    theme_color: "#0b1220",
  };
}
