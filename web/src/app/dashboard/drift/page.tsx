"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { duckdbService } from "@/lib/duckdb";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Database,
    RefreshCw,
    Plus,
    Minus,
    Type
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColumnStats {
    name: string;
    type: string;
    nullCount: number;
    nullPercentage: number;
    distinctCount: number;
    isNullable: boolean;
}

interface DriftItem {
    column: string;
    type: "addition" | "removal" | "type_change" | "null_drift" | "unchanged";
    details: string;
    severity: "low" | "medium" | "high";
    current?: any;
    baseline?: any;
}

export default function DriftPage() {
    const { activeTable, schema, rowCount, getActiveBaseline } = useData();
    const [loading, setLoading] = useState(false);
    const [currentStats, setCurrentStats] = useState<ColumnStats[]>([]);
    const baseline = getActiveBaseline();

    useEffect(() => {
        async function fetchCurrentStats() {
            if (!activeTable || !schema) return;
            setLoading(true);
            try {
                const nullQueries = schema.map(col => `sum(case when "${col.column_name}" is null then 1 else 0 end) as "${col.column_name}_nulls"`).join(", ");
                const distinctQueries = schema.map(col => `count(distinct "${col.column_name}") as "${col.column_name}_distinct"`).join(", ");

                const sql = `SELECT ${nullQueries}, ${distinctQueries} FROM "${activeTable}"`;
                const results = await duckdbService.query(sql);
                const rawStats = results[0];

                const processed = schema.map(col => ({
                    name: col.column_name,
                    type: col.column_type,
                    nullCount: Number(rawStats[`${col.column_name}_nulls`]),
                    nullPercentage: rowCount > 0 ? (Number(rawStats[`${col.column_name}_nulls`]) / rowCount) * 100 : 0,
                    distinctCount: Number(rawStats[`${col.column_name}_distinct`]),
                    isNullable: col.null === "YES"
                }));
                setCurrentStats(processed);
            } catch (err) {
                console.error("Drift analysis failed:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCurrentStats();
    }, [activeTable, schema, rowCount]);

    const driftResults = useMemo(() => {
        if (!baseline || currentStats.length === 0) return [];

        const results: DriftItem[] = [];
        const currentMap = new Map(currentStats.map(s => [s.name, s]));
        const baselineMap = new Map((baseline as ColumnStats[]).map(s => [s.name, s]));

        // Check for additions and type changes
        currentStats.forEach(curr => {
            const base = baselineMap.get(curr.name);
            if (!base) {
                results.push({
                    column: curr.name,
                    type: "addition",
                    details: "New column detected",
                    severity: "low"
                });
            } else {
                if (curr.type !== base.type) {
                    results.push({
                        column: curr.name,
                        type: "type_change",
                        details: `Type changed from ${base.type} to ${curr.type}`,
                        severity: "high",
                        current: curr.type,
                        baseline: base.type
                    });
                }

                // Null drift detection (> 5% change)
                const diff = Math.abs(curr.nullPercentage - base.nullPercentage);
                if (diff > 5) {
                    results.push({
                        column: curr.name,
                        type: "null_drift",
                        details: `Null percentage shifted by ${diff.toFixed(1)}%`,
                        severity: diff > 20 ? "high" : "medium",
                        current: curr.nullPercentage,
                        baseline: base.nullPercentage
                    });
                }
            }
        });

        // Check for removals
        (baseline as ColumnStats[]).forEach(base => {
            if (!currentMap.has(base.name)) {
                results.push({
                    column: base.name,
                    type: "removal",
                    details: "Column missing from current dataset",
                    severity: "high"
                });
            }
        });

        return results;
    }, [baseline, currentStats]);

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Activity className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">Drift Detection</h2>
                <p className="text-muted-foreground max-w-sm">
                    Load a dataset and set a baseline to start monitoring schema and data drift.
                </p>
            </div>
        );
    }

    if (!baseline) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-orange-500/10 p-6 rounded-full">
                    <AlertTriangle className="h-12 w-12 text-orange-500/40" />
                </div>
                <h2 className="text-2xl font-bold">No Baseline Set</h2>
                <p className="text-muted-foreground max-w-sm">
                    You haven't set a baseline for this dataset. Go to <b>Schema View</b> and click "Set as Baseline" to begin tracking drift.
                </p>
            </div>
        );
    }

    const criticalIssues = driftResults.filter(r => r.severity === "high").length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Drift Analysis</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                        Comparing Current vs. Baseline
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-white/10">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Re-Scan
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-6 space-y-2" variant="subtle">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Analysis Status</span>
                    <div className="flex items-center gap-2 text-xl font-bold">
                        {driftResults.length === 0 ? (
                            <div className="flex items-center gap-2 text-primary">
                                <CheckCircle2 className="h-5 w-5" />
                                <span>Healthy</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-orange-400">
                                <AlertTriangle className="h-5 w-5" />
                                <span>Drift Detected</span>
                            </div>
                        )}
                    </div>
                </GlassCard>
                <GlassCard className="p-6 space-y-2" variant="subtle">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Changes</span>
                    <div className="text-2xl font-bold">{driftResults.length}</div>
                </GlassCard>
                <GlassCard className="p-6 space-y-2" variant="subtle">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Critical Alerts</span>
                    <div className={cn("text-2xl font-bold", criticalIssues > 0 ? "text-red-500" : "text-foreground")}>
                        {criticalIssues}
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold">Change Log</h2>
                {driftResults.length === 0 ? (
                    <div className="bg-primary/5 border border-primary/20 border-dashed p-10 rounded-2xl text-center">
                        <div className="bg-primary/20 p-4 rounded-full w-fit mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold">No Drift Detected</h3>
                        <p className="text-muted-foreground text-sm">Your dataset schema matches the baseline perfectly.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {driftResults.map((item, i) => (
                            <GlassCard key={i} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" variant="subtle">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        item.type === "addition" ? "bg-primary/20 text-primary" :
                                            item.type === "removal" ? "bg-red-500/20 text-red-500" :
                                                item.type === "type_change" ? "bg-blue-500/20 text-blue-500" : "bg-orange-500/20 text-orange-500"
                                    )}>
                                        {item.type === "addition" ? <Plus className="h-5 w-5" /> :
                                            item.type === "removal" ? <Minus className="h-5 w-5" /> :
                                                item.type === "type_change" ? <Type className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold">{item.column}</h4>
                                            <Badge variant="outline" className="text-[9px] uppercase font-mono py-0">{item.type.replace("_", " ")}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.details}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    {item.current !== undefined && (
                                        <div className="flex items-center gap-3 font-mono text-[10px]">
                                            <div className="flex flex-col items-end">
                                                <span className="text-muted-foreground">BASELINE</span>
                                                <span className="text-foreground font-bold">
                                                    {typeof item.baseline === 'number' ? `${item.baseline.toFixed(1)}%` : item.baseline}
                                                </span>
                                            </div>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            <div className="flex flex-col items-start text-primary">
                                                <span className="text-muted-foreground">CURRENT</span>
                                                <span className="font-bold">
                                                    {typeof item.current === 'number' ? `${item.current.toFixed(1)}%` : item.current}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className={cn(
                                        "w-2 h-10 rounded-full",
                                        item.severity === "high" ? "bg-red-500" : item.severity === "medium" ? "bg-orange-400" : "bg-blue-400"
                                    )} />
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
