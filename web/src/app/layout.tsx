import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DataGuard | Open-Source Data Quality & Lineage",
  description: "Detect schema drift, define quality rules, and track data lineage - all in-browser via DuckDB-WASM. Your data never leaves your machine.",
  keywords: ["data quality", "schema drift", "data validation", "data lineage", "DuckDB", "open source", "privacy-first"],
  authors: [{ name: "Ayush Varma" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "DataGuard | Browser-Native Data Quality",
    description: "Privacy-first data quality framework powered by DuckDB-WASM.",
    url: "https://dataguard.dev",
    siteName: "DataGuard",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DataGuard | Open Source Data Quality",
    description: "Detect schema drift and monitor quality rules in-browser.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
