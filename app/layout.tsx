import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistPixelGrid } from "geist/font/pixel";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { JSX } from "react";

import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  description:
    "Look up the nearest NOAA NWS NEXRAD radar station for any latitude/longitude and browse raw, live Level II volume-scan files from the public NEXRAD archive.",
  generator: "v0.app",
  manifest: "/manifest.json",
  title: "Weather Café",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b1220",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html
      lang="en"
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable} ${GeistPixelGrid.variable}`}
    >
      <body className="antialiased font-sans">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
      </body>
    </html>
  );
}
