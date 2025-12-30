"use client";

import React, { useState, useEffect } from "react";
import { UniversalFileUpload } from "@/components/shared/UniversalFileUpload";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import {
    ArrowUpRight,
    BarChart3,
    Clock,
    FileText,
    ShieldCheck,
    AlertCircle,
    RefreshCw,
    X,
    Database,
    Download,
    FileSpreadsheet,
    FileJson
} from "lucide-react";
import { FormatBadge } from "@/components/shared/FormatBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { duckdbService } from "@/lib/duckdb";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { exportTable, ExportFormat } from "@/lib/format-export";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function DashboardPage() {
    const { activeTable, tables, setActiveTable, removeTable, resetData } = useData();
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    const activeTableData = activeTable ? tables[activeTable] : null;

    useEffect(() => {
        async function loadPreview() {
            if (activeTable) {
                try {
                    const results = await duckdbService.query(`SELECT * FROM "${activeTable}" LIMIT 5`);
                    setPreviewData(results);
                } catch (err) {
                    console.error("Preview failed:", err);
                }
            } else {
                setPreviewData(null);
            }
        }
        loadPreview();
    }, [activeTable]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">Multi-Dataset Engine Registry</p>
                </div>
                <div className="flex gap-2 text-xs font-medium">
                    {Object.keys(tables).length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetData}
                            className="h-8 border-white/10 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            Reset Engine
                        </Button>
                    )}
                    <div className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 flex items-center gap-2">
                        <BarChart3 className="h-3.5 w-3.5 text-primary" />
                        {Object.keys(tables).length} active tables
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Registry & Upload */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Database className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-sm tracking-tight uppercase">Dataset Registry</h3>
                        </div>
                        <div className="space-y-2">
                            {Object.values(tables).map((t) => (
                                <GlassCard
                                    key={t.name}
                                    className={cn(
                                        "p-3 cursor-pointer group transition-all duration-300",
                                        activeTable === t.name ? "border-primary/50 bg-primary/5 shadow-primary/10" : "border-white/5 hover:border-white/20"
                                    )}
                                    variant="subtle"
                                    onClick={() => setActiveTable(t.name)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-1.5 rounded-lg border transition-colors",
                                                activeTable === t.name ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                                            )}>
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="text-xs font-bold truncate">{t.name}</span>
                                                    {t.sourceFormat && <FormatBadge format={t.sourceFormat as any} className="scale-75 origin-left" />}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground lowercase">{t.rowCount.toLocaleString()} rows</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                                            onClick={(e) => { e.stopPropagation(); removeTable(t.name); }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </GlassCard>
                            ))}
                            <div className="pt-2">
                                <UniversalFileUpload onUploadSuccess={(results) => {
                                    if (results.length > 0) setActiveTable(results[0].name);
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Active Table Stats & Preview */}
                <div className="lg:col-span-2 space-y-6">
                    {!activeTable ? (
                        <GlassCard className="h-full flex flex-col items-center justify-center py-20 bg-white/[0.02]" variant="subtle">
                            <BarChart3 className="h-12 w-12 text-primary/20 mb-4" />
                            <p className="text-muted-foreground text-sm italic">Select a dataset from the registry to view analytics</p>
                        </GlassCard>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Mini Stats Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <GlassCard className="p-4 space-y-1" variant="subtle">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active Table</span>
                                    <div className="text-2xl font-bold text-primary truncate">{activeTable}</div>
                                </GlassCard>
                                <GlassCard className="p-4 space-y-1" variant="subtle">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Row Count</span>
                                    <div className="text-2xl font-bold">
                                        <AnimatedCounter value={activeTableData?.rowCount || 0} />
                                    </div>
                                </GlassCard>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="font-bold text-sm tracking-tight uppercase inline-flex items-center gap-2">
                                        Previewing Head
                                        <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/10">LIMIT 5</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-7 text-[10px] border-white/10">
                                                    <Download className="mr-1 h-3 w-3" />
                                                    Export
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-[#0a0a0f] border-white/10">
                                                <DropdownMenuItem
                                                    onClick={() => activeTable && exportTable({ format: 'csv', tableName: activeTable })}
                                                    className="text-xs cursor-pointer"
                                                >
                                                    <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                                                    Export as CSV
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => activeTable && exportTable({ format: 'json', tableName: activeTable })}
                                                    className="text-xs cursor-pointer"
                                                >
                                                    <FileJson className="mr-2 h-3.5 w-3.5" />
                                                    Export as JSON
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>


                                <GlassCard className="overflow-hidden border-white/5">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.03]">
                                                    {Object.keys(previewData?.[0] || {}).map((key) => (
                                                        <TableHead key={key} className="text-muted-foreground font-mono text-[9px] h-9 px-4 uppercase tracking-tighter">
                                                            {key}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData?.map((row, i) => (
                                                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.01]">
                                                        {Object.values(row).map((val: any, j) => (
                                                            <TableCell key={j} className="font-mono text-[10px] py-2 px-4 text-foreground/80">
                                                                {val === null ? <span className="text-muted-foreground/30 italic uppercase">null</span> : String(val)}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
