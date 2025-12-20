"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, GitBranch, AlertCircle, BarChart3, Database } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

const features = [
    {
        title: "Schema Drift Detection",
        description: "Automatically detect when data types change, columns are added, or required fields go missing across versions.",
        icon: Search,
        color: "text-primary",
        bg: "bg-primary/10",
        demo: (
            <div className="space-y-2 font-mono text-[10px] leading-tight">
                <div className="flex justify-between text-muted-foreground border-b border-white/5 pb-1">
                    <span>Column</span>
                    <span>Status</span>
                </div>
                <div className="flex justify-between items-center text-foreground">
                    <span>user_id</span>
                    <span className="text-primary">MATCH</span>
                </div>
                <div className="flex justify-between items-center text-foreground bg-red-500/10 rounded px-1 -mx-1">
                    <span>email</span>
                    <span className="text-red-400">CHANGED (TEXT → INT)</span>
                </div>
                <div className="flex justify-between items-center text-foreground bg-primary/10 rounded px-1 -mx-1">
                    <span>updated_at</span>
                    <span className="text-primary font-bold">+ NEW</span>
                </div>
            </div>
        ),
    },
    {
        title: "Validation Rules Engine",
        description: "Define complex quality rules in simple YAML. Run range checks, null checks, and regex patterns instantly.",
        icon: CheckCircle,
        color: "text-secondary",
        bg: "bg-secondary/10",
        demo: (
            <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                        />
                    </div>
                    <span className="text-[10px] font-mono">100%</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/5">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                        <motion.div
                            className="h-full bg-orange-400"
                            initial={{ width: "0%" }}
                            whileInView={{ width: "85%" }}
                            transition={{ duration: 1.2, delay: 0.7 }}
                        />
                    </div>
                    <span className="text-[10px] font-mono">85%</span>
                </div>
            </div>
        ),
    },
    {
        title: "Column-Level Lineage",
        description: "Track how data flows from source to destination. Visualize transformations and dependencies in an interactive DAG.",
        icon: GitBranch,
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        demo: (
            <div className="relative flex justify-center items-center py-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-secondary" />
                        </div>
                    </div>
                    <svg className="w-12 h-8">
                        <motion.path
                            d="M10,0 L10,30 M50,0 L50,30"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            className="text-white/10"
                        />
                    </svg>
                    <div className="w-12 h-12 rounded-xl glass border-white/10 flex items-center justify-center shadow-lg">
                        <GitBranch className="h-6 w-6 text-orange-400" />
                    </div>
                </div>
            </div>
        ),
    },
];

export function Features() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    return (
        <section id="features" className="py-24 px-4 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto space-y-20">
                {/* Section Heading */}
                <div className="text-center space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Universal observability <br />
                        <span className="text-muted-foreground">for any data source.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground max-w-2xl mx-auto"
                    >
                        Powerful features designed for modern data engineering teams.
                        Lightweight, fast, and entirely client-side.
                    </motion.p>
                </div>

                {/* Feature Cards Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={cardVariants}>
                            <GlassCard
                                variant="default"
                                gradientBorder
                                className="h-full flex flex-col p-8 group hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className="space-y-6 flex-1">
                                    <div className={cn("inline-flex p-3 rounded-2xl", feature.bg)}>
                                        <feature.icon className={cn("h-7 w-7", feature.color)} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Mini Demo Area */}
                                <div className="mt-10 p-4 rounded-xl bg-black/40 border border-white/5 group-hover:border-primary/20 transition-colors">
                                    {feature.demo}
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
