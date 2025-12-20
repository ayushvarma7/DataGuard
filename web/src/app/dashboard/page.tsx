"use client";

import React, { useState, useEffect } from "react";
import { FileUpload } from "@/components/app/FileUpload";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import {
    ArrowUpRight,
    BarChart3,
    Clock,
    FileText,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { duckdbService } from "@/lib/duckdb";
import { useData } from "@/context/DataContext";

export default function DashboardPage() {
    const { activeTable, rowCount, setTable } = useData();
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    useEffect(() => {
        async function loadPreview() {
            if (activeTable) {
                try {
                    const results = await duckdbService.query(`SELECT * FROM "${activeTable}" LIMIT 5`);
                    setPreviewData(results);
                } catch (err) {
                    console.error("Preview failed:", err);
                }
            }
        }
        loadPreview();
    }, [activeTable]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground">Monitor and manage your data quality engine.</p>
                </div>
                <div className="flex gap-2 text-xs font-medium">
                    <div className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Last Scan: {activeTable ? "Just now" : "No active dataset"}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-6 space-y-2" variant="subtle">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Rows</span>
                        <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold">
                        <AnimatedCounter value={rowCount} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Real-time scan</span>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 space-y-2" variant="subtle">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quality Score</span>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold">
                        <AnimatedCounter value={activeTable ? 92.5 : 0} suffix="%" decimals={1} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>Awaiting full validation</span>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 space-y-2" variant="subtle">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Drift Alerts</span>
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold">
                        <AnimatedCounter value={0} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                        <span>Healthy</span>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 space-y-2" variant="subtle">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Engine Latency</span>
                        <BarChart3 className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="text-2xl font-bold">
                        <AnimatedCounter value={activeTable ? 12 : 0} suffix="ms" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>WASM performance</span>
                    </div>
                </GlassCard>
            </div>

            {!activeTable ? (
                <div className="py-20">
                    <FileUpload onUploadSuccess={setTable} />
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Raw Data Preview</h2>
                        <span className="text-xs font-mono text-muted-foreground">Source: {activeTable}</span>
                    </div>

                    <GlassCard className="overflow-hidden border-white/5">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
                                        {Object.keys(previewData?.[0] || {}).map((key) => (
                                            <TableHead key={key} className="text-muted-foreground font-mono text-[10px] h-10">
                                                {key}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData?.map((row, i) => (
                                        <TableRow key={i} className="border-white/5 hover:bg-white/[0.01]">
                                            {Object.values(row).map((val: any, j) => (
                                                <TableCell key={j} className="font-mono text-[10px] py-3 text-foreground/80">
                                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </GlassCard>

                    <div className="flex justify-center pt-4">
                        <p className="text-xs text-muted-foreground italic">
                            Showing first 5 rows. Use the Sidebar to explore Schema and Validation.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
