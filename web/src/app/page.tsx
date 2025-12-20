"use client";

import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />

      {/* 
          Additional Sections (F1.3 - F1.4) will be added here
      */}

      {/* Footer will be added in F1.5 */}
    </main>
  );
}
