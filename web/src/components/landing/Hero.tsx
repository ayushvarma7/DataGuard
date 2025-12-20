"use client";

import React from "react";
import { motion } from "framer-motion";
import { Upload, Shield, ChevronRight, Github, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import Link from "next/link";

export function Hero() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-20 px-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] animate-pulse" />
            </div>

            {/* Navbar Bridge (Floating) */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-7xl px-6 flex justify-between items-center z-50"
            >
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">DataGuard</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground mr-1">
                    <Link href="/dashboard/docs" className="hover:text-foreground transition-colors">Documentation</Link>
                    <a href="https://github.com/ayushvarma7/DataGuard" target="_blank" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <Github className="h-4 w-4" />
                        GitHub
                    </a>
                    <Link href="/dashboard">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            Launch App
                        </Button>
                    </Link>
                </div>
            </motion.nav>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-5xl w-full text-center space-y-8 z-10"
            >
                {/* Badge */}
                <motion.div variants={itemVariants} className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Now Powered by DuckDB-WASM
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    variants={itemVariants}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
                >
                    Data Quality You Can <br />
                    <span className="text-gradient-animated">Actually Trust.</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                    Schema drift detection, validation rules, and lineage tracking —
                    all running <span className="text-foreground font-medium">locally in your browser</span>.
                    Your data never leaves your machine.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground glow-primary group">
                            Try It Now — No Signup
                            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <a href="https://github.com/ayushvarma7/DataGuard" target="_blank">
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5 backdrop-blur-sm">
                            <Github className="mr-2 h-5 w-5" />
                            View on GitHub
                        </Button>
                    </a>
                </motion.div>

                {/* Dropzone Preview */}
                <motion.div variants={itemVariants} className="pt-12">
                    <GlassCard className="max-w-2xl mx-auto p-1 cursor-default group overflow-hidden gradient-border">
                        <div className="bg-[#0a0a0f]/80 rounded-lg p-12 border border-dashed border-white/10 group-hover:border-primary/50 transition-colors flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                <div className="relative bg-primary/10 p-5 rounded-2xl border border-primary/20">
                                    <Upload className="h-10 w-10 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">Drop your data here</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    Select CSV or Parquet files to instantly detect schema drift and run quality checks.
                                </p>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Shield className="h-3 w-3 text-secondary" />
                                    100% Client-side
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Activity className="h-3 w-3 text-secondary" />
                                    WASM Powered
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Fake Trust Badges / Built With */}
                <motion.div variants={itemVariants} className="pt-16 space-y-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-semibold">Powered By & Trusted By</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <div className="bg-white text-black px-1.5 py-0.5 rounded text-sm">DuckDB</div>
                            <span>WASM</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-lg">
                            <Github className="h-6 w-6" />
                            <span>GitHub</span>
                        </div>
                        <div className="text-xl font-serif italic tracking-tighter">Vercel</div>
                        <div className="flex items-center gap-1 font-bold text-lg">
                            <FileText className="h-5 w-5" />
                            <span>Parquet</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Floating Elements / Background Polish */}
            <div className="absolute top-1/2 left-10 opacity-20 hidden lg:block animate-float">
                <GlassCard className="p-3 text-xs font-mono text-primary">
                    SELECT * FROM results WHERE success = false;
                </GlassCard>
            </div>
            <div className="absolute bottom-20 right-10 opacity-20 hidden lg:block animate-float" style={{ animationDelay: "2s" }}>
                <GlassCard className="p-3 text-xs font-mono text-secondary">
                    Detected: Column "price" type changed to VARCHAR
                </GlassCard>
            </div>
        </section>
    );
}
