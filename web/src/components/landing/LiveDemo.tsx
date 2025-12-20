"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Layout, Settings, Layers, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

export function LiveDemo() {
    return (
        <section id="demo" className="py-24 px-4 bg-background relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary"
                    >
                        DASHBOARD PREVIEW
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Built for <span className="text-gradient">Data Perfectionists.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground max-w-2xl mx-auto"
                    >
                        An intuitive interface that makes data quality monitoring feel like
                        observing the stars. Modern, fast, and completely private.
                    </motion.p>
                </div>

                {/* Mock Application Interface */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative max-w-6xl mx-auto"
                >
                    <GlassCard className="p-0 overflow-hidden border-white/10 shadow-2xl shadow-black/50" gradientBorder>
                        {/* Mock Header */}
                        <div className="h-14 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1.5 leading-none">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                </div>
                                <div className="h-4 w-px bg-white/10 mx-2" />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                    <Layout className="h-3 w-3" />
                                    workspace / <span className="text-foreground">e-commerce-v2.parquet</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                    JD
                                </div>
                            </div>
                        </div>

                        <div className="flex h-[500px]">
                            {/* Mock Sidebar */}
                            <div className="w-60 border-r border-white/5 bg-white/[0.01] p-4 hidden md:block space-y-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                                        <Layers className="h-4 w-4" />
                                        Schema View
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 text-xs font-medium transition-colors">
                                        <Shield className="h-4 w-4" />
                                        Validation Rules
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 text-xs font-medium transition-colors">
                                        <Settings className="h-4 w-4" />
                                        Configurations
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <p className="px-3 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Datasets</p>
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 text-xs text-foreground/80 flex items-center justify-between">
                                            <span className="truncate">users_v1.csv</span>
                                            <CheckCircle2 className="h-3 w-3 text-primary" />
                                        </div>
                                        <div className="px-3 py-2 text-xs text-foreground/80 flex items-center justify-between">
                                            <span className="truncate">orders_2023.parquet</span>
                                            <AlertCircle className="h-3 w-3 text-orange-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mock Main Content */}
                            <div className="flex-1 bg-black/40 p-6 overflow-hidden">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-20 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="h-8 w-40 rounded-lg bg-white/5" />
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="h-12 rounded-lg bg-white/[0.02] border border-white/5 flex items-center px-4 gap-4">
                                                <div className="h-2 w-2 rounded-full bg-primary/50" />
                                                <div className="h-3 w-32 rounded bg-white/5" />
                                                <div className="h-3 w-64 rounded bg-white/5 hidden lg:block" />
                                                <div className="ml-auto h-3 w-16 rounded bg-white/5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Floating UI Elements for depth */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-6 -right-6 hidden lg:block"
                    >
                        <GlassCard className="p-4 bg-primary/10 border-primary/20 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs font-bold text-foreground">Rule Passed</p>
                                    <p className="text-[10px] text-muted-foreground italic">Column "price" is always positive</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-6 -left-6 hidden lg:block"
                    >
                        <GlassCard className="p-4 bg-orange-400/10 border-orange-400/20 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-400" />
                                <div>
                                    <p className="text-xs font-bold text-foreground">Schema Drift</p>
                                    <p className="text-[10px] text-muted-foreground italic">New column "tax_rate" detected</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
