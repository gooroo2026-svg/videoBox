import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const adsenseConsentReady = process.env.NEXT_PUBLIC_ADSENSE_CONSENT_READY === "true";

export const metadata: Metadata = {
  title: "VideoBox | Watch, Discover, Connect",
  description: "Discover films, shorts, and stories from VideoBox creators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {adsenseClient && adsenseConsentReady && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`}
            crossOrigin="anonymous"
          />
        )}
        {children}
      </body>
    </html>
  );
}
