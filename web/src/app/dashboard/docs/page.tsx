"use client";

import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import {
    Book,
    Shield,
    Zap,
    GitBranch,
    Terminal,
    Database,
    ArrowRight,
    CheckCircle2,
    ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
    {
        title: "Getting Started",
        icon: Zap,
        content: "DataGuard is a browser-native data quality framework. To begin, upload a CSV or Parquet file in the 'Overview' tab. Your data is processed entirely locally using DuckDB-WASM.",
        items: [
            "Upload CSV or Parquet files",
            "Automatic schema detection",
            "Local-first privacy protection"
        ]
    },
    {
        title: "Schema & Baselining",
        icon: Database,
        content: "Once a dataset is loaded, use the 'Schema' tab to explore column statistics. You can 'Lock Baseline' to save the current schema structure. This enables future drift detection.",
        items: [
            "View null percentages & unique counts",
            "Interactive distribution histograms",
            "Lock baselines for regression testing"
        ]
    },
    {
        title: "Validation Rules",
        icon: Shield,
        content: "Define data quality guardrails in the 'Validation' tab. Use 'Smart Suggestions' to quickly generate rules based on your data's profile.",
        items: [
            "Check for NULL constraints",
            "Verify unique column values",
            "Export rules as CLI-compatible YAML"
        ]
    },
    {
        title: "SQL Lab",
        icon: Terminal,
        content: "Standard SQL engine powered by DuckDB. Perfect for complex joins, multi-dataset correlation, and custom profiling queries.",
        items: [
            "Support for CTEs & Window Functions",
            "Query multiple datasets simultaneously",
            "Export query results as CSV"
        ]
    },
    {
        title: "Vercel Deployment",
        icon: Zap,
        content: "DataGuard is fully compatible with Vercel. Since it's a static Next.js app, you can deploy it in seconds with global edge distribution.",
        items: [
            "Push to GitHub & Auto-deploy",
            "Zero server-side dependencies",
            "Global CDN for WASM binaries"
        ]
    },
    {
        title: "CLI Sync (YAML)",
        icon: GitBranch,
        content: "Bridge the gap between UI and Code. Export your validation rules as YAML and use them directly in your Python ETL pipelines.",
        items: [
            "One-click 'checks.yaml' export",
            "CLI command: 'dataguard check'",
            "CI/CD integration for data quality"
        ]
    }
];

export default function DocsPage() {
    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">Documentation</Badge>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
                    Master DataGuard
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                    Everything you need to know about building robust, private, and automated data quality pipelines directly in your browser.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, i) => (
                    <GlassCard key={i} className="p-8 group hover:border-primary/40 transition-all duration-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <section.icon className="h-32 w-32 -mr-8 -mt-8" />
                        </div>

                        <div className="bg-primary/10 p-3 rounded-xl w-fit mb-6 text-primary border border-primary/10">
                            <section.icon className="h-6 w-6" />
                        </div>

                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                            {section.title}
                            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                        </h3>

                        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                            {section.content}
                        </p>

                        <ul className="space-y-3">
                            {section.items.map((item, j) => (
                                <li key={j} className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </GlassCard>
                ))}
            </div>

            <GlassCard className="p-10 border-blue-500/10 bg-blue-500/[0.02] flex flex-col md:flex-row items-center gap-8 overflow-hidden">
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <ShieldAlert className="h-5 w-5 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Privacy Guarantee</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Your Data, Your Machine</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Unlike traditional SaaS tools, DataGuard processes all information locally using WASM technology.
                        No CSV contents or schema details are ever uploaded to our servers. Your security and privacy are baked into the architecture.
                    </p>
                </div>
                <div className="w-full md:w-auto flex justify-center">
                    <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-blue-500/20 to-primary/20 border border-white/5 flex items-center justify-center p-6 relative">
                        <div className="absolute inset-0 bg-blue-400/10 blur-2xl opacity-50" />
                        <Shield className="h-full w-full text-blue-400" />
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
