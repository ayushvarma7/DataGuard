"use client";

import React from "react";
import { motion } from "framer-motion";
import { Upload, Cpu, ShieldCheck, Download, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

const steps = [
    {
        title: "Connect",
        description: "Drop your CSV or Parquet files. Everything stays local in your browser.",
        icon: Upload,
        color: "text-blue-400",
    },
    {
        title: "Detect",
        description: "Our WASM engine instantly identifies schema drift and structural changes.",
        icon: Cpu,
        color: "text-primary",
    },
    {
        title: "Validate",
        description: "Apply complex quality rules to catch nulls, outliers, and pattern breaks.",
        icon: ShieldCheck,
        color: "text-secondary",
    },
    {
        title: "Insight",
        description: "Visualize data lineage and export validated results for production pipelines.",
        icon: Download,
        color: "text-purple-400",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 px-4 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center space-y-4 mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Data Quality in <span className="text-gradient">4 Simple Steps.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground max-w-2xl mx-auto"
                    >
                        From raw files to validated insights in seconds, without ever sending
                        a single byte to a server.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 hidden lg:block" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="relative group"
                            >
                                {/* Step Number Badge */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-surface border border-white/10 text-[10px] font-bold px-3 py-1 rounded-full z-20 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors">
                                    STEP 0{index + 1}
                                </div>

                                <GlassCard
                                    className="p-8 h-full flex flex-col items-center text-center gap-6 group-hover:scale-[1.02] transition-transform duration-300"
                                    gradientBorder
                                >
                                    <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors`}>
                                        <step.icon className={`h-8 w-8 ${step.color}`} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold">{step.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>

                                    {index < steps.length - 1 && (
                                        <motion.div
                                            className="mt-2 hidden lg:block opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all"
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        </motion.div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
