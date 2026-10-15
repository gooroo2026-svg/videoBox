import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VideoBox",
    short_name: "VideoBox",
    description: "Cinematic streaming, creator discovery, and short-form video culture.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      {
        src: "/window.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
