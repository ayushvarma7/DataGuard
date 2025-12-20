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
    BarChart2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ColumnStats {
    name: string;
    type: string;
    nullCount: number;
    nullPercentage: number;
    distinctCount: number;
    isNullable: boolean;
}

export default function SchemaPage() {
    const { activeTable, schema, rowCount } = useData();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ColumnStats[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchStats() {
            if (!activeTable || !schema) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Build a massive aggregate query to get stats for all columns in one go
                const nullQueries = schema.map(col => `sum(case when "${col.column_name}" is null then 1 else 0 end) as "${col.column_name}_nulls"`).join(", ");
                const distinctQueries = schema.map(col => `count(distinct "${col.column_name}") as "${col.column_name}_distinct"`).join(", ");

                const sql = `SELECT ${nullQueries}, ${distinctQueries} FROM "${activeTable}"`;
                const results = await duckdbService.query(sql);
                const rawStats = results[0];

                const processedStats = schema.map(col => {
                    const nulls = Number(rawStats[`${col.column_name}_nulls`]);
                    const distinct = Number(rawStats[`${col.column_name}_distinct`]);
                    return {
                        name: col.column_name,
                        type: col.column_type,
                        nullCount: nulls,
                        nullPercentage: rowCount > 0 ? (nulls / rowCount) * 100 : 0,
                        distinctCount: distinct,
                        isNullable: col.null === "YES"
                    };
                });

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
                ) : filteredStats.map((col, i) => (
                    <GlassCard key={i} className="p-6 group hover:border-primary/30 transition-all duration-300" variant="subtle">
                        <div className="flex items-start justify-between mb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{col.name}</h3>
                                    {col.nullCount === 0 && (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                    )}
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono tracking-tighter py-0 px-2 bg-white/5 border-white/10">
                                    {col.type}
                                </Badge>
                            </div>
                            <BarChart2 className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                    <Percent className="h-3 w-3" />
                                    Nulls
                                </div>
                                <div className="flex items-end gap-2 text-xl font-bold">
                                    <span className={cn(col.nullCount > 0 ? "text-orange-400" : "text-foreground")}>
                                        {col.nullPercentage.toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mb-1 font-normal italic">
                                        ({col.nullCount})
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                    <Hash className="h-3 w-3" />
                                    Distinct
                                </div>
                                <div className="text-xl font-bold text-foreground">
                                    {col.distinctCount.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Quality Progress Bar */}
                        <div className="mt-6 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                                <span>Data Quality</span>
                                <span>{Math.max(0, 100 - col.nullPercentage).toFixed(0)}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        col.nullPercentage > 20 ? "bg-red-500" : col.nullPercentage > 5 ? "bg-orange-400" : "bg-primary"
                                    )}
                                    style={{ width: `${100 - col.nullPercentage}%` }}
                                />
                            </div>
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
