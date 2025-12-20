"use client";

import React, { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { duckdbService } from "@/lib/duckdb";
import {
    Search,
    Database,
    Hash,
    Type,
    Percent,
    CheckCircle2,
    AlertCircle,
    BarChart2,
    Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Cell
} from "recharts";

interface ColumnStats {
    name: string;
    type: string;
    nullCount: number;
    nullPercentage: number;
    distinctCount: number;
    isNullable: boolean;
    histogram?: { bin: number; count: number }[];
}

export default function SchemaPage() {
    const { activeTable, schema, rowCount, setBaseline } = useData();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ColumnStats[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [baselineSuccess, setBaselineSuccess] = useState(false);

    const handleSetBaseline = () => {
        if (activeTable) {
            setBaseline(activeTable, stats);
            setBaselineSuccess(true);
            setTimeout(() => setBaselineSuccess(false), 3000);
        }
    };

    useEffect(() => {
        async function fetchStats() {
            if (!activeTable || !schema) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Basic Stats Query
                const nullQueries = schema.map(col => `sum(case when "${col.column_name}" is null then 1 else 0 end) as "${col.column_name}_nulls"`).join(", ");
                const distinctQueries = schema.map(col => `count(distinct "${col.column_name}") as "${col.column_name}_distinct"`).join(", ");

                const sql = `SELECT ${nullQueries}, ${distinctQueries} FROM "${activeTable}"`;
                const results = await duckdbService.query(sql);
                const rawStats = results[0];

                const processedStats: ColumnStats[] = await Promise.all(schema.map(async col => {
                    const nulls = Number(rawStats[`${col.column_name}_nulls`]);
                    const distinct = Number(rawStats[`${col.column_name}_distinct`]);

                    let histogram;
                    // 2. Fetch Histogram for Numeric Columns
                    const isNumeric = /INT|FLOAT|DOUBLE|DECIMAL|HUGEINT/i.test(col.column_type);
                    if (isNumeric && rowCount > 0) {
                        try {
                            const histSql = `
                          WITH bins AS (
                            SELECT floor(("${col.column_name}" - min_val) / (max_val - min_val + 0.000001) * 10) as bin
                            FROM "${activeTable}", (SELECT min("${col.column_name}") as min_val, max("${col.column_name}") as max_val FROM "${activeTable}") as m
                            WHERE "${col.column_name}" IS NOT NULL
                          )
                          SELECT bin, count(*) as count FROM bins GROUP BY bin ORDER BY bin
                        `;
                            const histRes = await duckdbService.query(histSql);
                            histogram = histRes.map(r => ({ bin: Number(r.bin), count: Number(r.count) }));
                        } catch (e) {
                            console.warn(`Histogram failed for ${col.column_name}`, e);
                        }
                    }

                    return {
                        name: col.column_name,
                        type: col.column_type,
                        nullCount: nulls,
                        nullPercentage: rowCount > 0 ? (nulls / rowCount) * 100 : 0,
                        distinctCount: distinct,
                        isNullable: col.null === "YES",
                        histogram
                    };
                }));

                setStats(processedStats);
            } catch (err) {
                console.error("Failed to fetch schema stats:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [activeTable, schema, rowCount]);

    const filteredStats = stats.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Database className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">No Active Dataset</h2>
                <p className="text-muted-foreground max-w-sm">
                    Please upload a CSV or Parquet file in the Overview tab to explore its schema.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Schema Explorer</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                        Table: {activeTable} • {stats.length} Columns detected
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSetBaseline}
                        className={cn(
                            "transition-all duration-300 whitespace-nowrap",
                            baselineSuccess
                                ? "bg-primary/20 text-primary border-primary/50 hover:bg-primary/30"
                                : "border-white/10 hover:bg-white/5"
                        )}
                    >
                        {baselineSuccess ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Baseline Set
                            </>
                        ) : (
                            <>
                                <Activity className="mr-2 h-4 w-4" />
                                Set as Baseline
                            </>
                        )}
                    </Button>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search columns or types..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <GlassCard key={i} className="p-6 space-y-4">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-32 bg-white/10" />
                                <Skeleton className="h-5 w-16 bg-white/10 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full bg-white/5" />
                                <Skeleton className="h-12 w-full bg-white/5" />
                            </div>
                        </GlassCard>
                    ))
                ) : filteredStats.map((col) => (
                    <GlassCard key={col.name} className="p-5 flex flex-col justify-between group hover:border-primary/40 transition-all duration-300" variant="subtle">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/20 transition-colors">
                                        <Type className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-bold text-sm tracking-tight text-foreground/90 truncate max-w-[120px]" title={col.name}>
                                        {col.name}
                                    </h3>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-white/5 border-white/10">
                                    {col.type}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                        <Hash className="h-3 w-3" />
                                        Distinct
                                    </div>
                                    <p className="text-sm font-bold font-mono text-foreground">
                                        {col.distinctCount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                        <Percent className="h-3 w-3" />
                                        Nulls
                                    </div>
                                    <p className={cn(
                                        "text-sm font-bold font-mono",
                                        col.nullPercentage > 5 ? "text-orange-400" : "text-foreground"
                                    )}>
                                        {col.nullPercentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-muted-foreground font-medium">Quality Score</span>
                                    <span className="font-bold text-primary">{(100 - col.nullPercentage).toFixed(0)}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-500",
                                            col.nullPercentage > 20 ? "bg-red-500" : col.nullPercentage > 5 ? "bg-orange-500" : "bg-primary"
                                        )}
                                        style={{ width: `${100 - col.nullPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {col.histogram && (
                            <div className="mt-4 pt-4 border-t border-white/5 h-16 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={col.histogram}>
                                        <Bar
                                            dataKey="count"
                                            radius={[2, 2, 0, 0]}
                                        >
                                            {col.histogram.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={col.nullPercentage > 5 ? "rgba(251, 146, 60, 0.4)" : "rgba(16, 185, 129, 0.4)"}
                                                    className="hover:fill-primary transition-colors cursor-pointer"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {col.nullPercentage === 0 ? (
                                    <CheckCircle2 className="h-3 w-3 text-primary" />
                                ) : (
                                    <AlertCircle className="h-3 w-3 text-orange-400" />
                                )}
                                <span className="text-[9px] font-medium text-muted-foreground">
                                    {col.nullPercentage === 0 ? "Perfect" : "Imperfect"}
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 hover:bg-white/5">
                                Details
                            </Button>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {filteredStats.length === 0 && !loading && (
                <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No columns found matching your search.</p>
                </div>
            )}
        </div>
    );
}
