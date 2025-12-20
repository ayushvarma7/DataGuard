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
  title: "DataGuard - Open Source Data Quality Framework",
  description: "Schema drift detection, validation rules, and lineage tracking — all in your browser. Your data never leaves your machine.",
  keywords: ["data quality", "schema drift", "data validation", "data lineage", "DuckDB", "open source"],
  authors: [{ name: "Ayush Varma" }],
  openGraph: {
    title: "DataGuard - Data Quality You Can Actually Trust",
    description: "Schema drift detection, validation rules, and lineage tracking — all in your browser.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DataGuard - Open Source Data Quality Framework",
    description: "Schema drift detection, validation rules, and lineage tracking — all in your browser.",
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
