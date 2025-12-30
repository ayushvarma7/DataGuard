"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Lightbulb,
    ArrowUpRight,
    Database,
    Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from "recharts";
import {
    analyzeTable,
    calculateTableQualityScore,
    calculateCorrelationMatrix,
    ColumnAnalytics,
    TableQualityScore
} from "@/lib/analytics";

export default function AnalyticsPage() {
    const { activeTable, tables } = useData();
    const [loading, setLoading] = useState(true);
    const [columnAnalytics, setColumnAnalytics] = useState<ColumnAnalytics[]>([]);
    const [qualityScore, setQualityScore] = useState<TableQualityScore | null>(null);
    const [correlation, setCorrelation] = useState<{ columns: string[]; matrix: number[][] } | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

    const activeTableData = activeTable ? tables[activeTable] : null;
    const schema = activeTableData?.schema;

    useEffect(() => {
        async function fetchAnalytics() {
            if (!activeTable || !schema) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const analytics = await analyzeTable(activeTable, schema);
                setColumnAnalytics(analytics);

                const score = await calculateTableQualityScore(activeTable, schema);
                setQualityScore(score);

                const numericCols = schema
                    .filter(c => /INT|FLOAT|DOUBLE|DECIMAL/i.test(c.column_type))
                    .map(c => c.column_name);

                if (numericCols.length >= 2) {
                    const corr = await calculateCorrelationMatrix(activeTable, numericCols.slice(0, 6));
                    setCorrelation(corr);
                }
            } catch (err) {
                console.error("Analytics failed:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [activeTable, schema]);

    const selectedAnalytics = useMemo(() =>
        columnAnalytics.find(c => c.name === selectedColumn),
        [columnAnalytics, selectedColumn]
    );

    const outlierColumns = useMemo(() =>
        columnAnalytics.filter(c => c.outliers),
        [columnAnalytics]
    );

    const suggestionColumns = useMemo(() =>
        columnAnalytics.filter(c => c.suggestedType),
        [columnAnalytics]
    );

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <BarChart3 className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">Advanced Analytics</h2>
                <p className="text-muted-foreground max-w-sm">
                    Upload a dataset to unlock quality scores, outlier detection, and correlation analysis.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                        Deep insights for {activeTable}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <GlassCard key={i} className="p-6 animate-pulse">
                            <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                            <div className="h-8 w-16 bg-white/5 rounded" />
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <>
                    {/* Quality Score Cards */}
                    {qualityScore && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GlassCard className="p-6 space-y-2" variant="subtle">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    Overall Quality
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-4xl font-bold",
                                        qualityScore.overallScore >= 80 ? "text-primary" :
                                            qualityScore.overallScore >= 60 ? "text-orange-400" : "text-red-500"
                                    )}>
                                        {qualityScore.overallScore}
                                    </span>
                                    <span className="text-muted-foreground text-sm">/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all",
                                            qualityScore.overallScore >= 80 ? "bg-primary" :
                                                qualityScore.overallScore >= 60 ? "bg-orange-400" : "bg-red-500"
                                        )}
                                        style={{ width: `${qualityScore.overallScore}%` }}
                                    />
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6 space-y-2" variant="subtle">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    Completeness
                                </span>
                                <div className="text-2xl font-bold">{qualityScore.completeness}%</div>
                                <p className="text-[10px] text-muted-foreground">Non-null values ratio</p>
                            </GlassCard>

                            <GlassCard className="p-6 space-y-2" variant="subtle">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    Uniqueness
                                </span>
                                <div className="text-2xl font-bold">{qualityScore.uniqueness}%</div>
                                <p className="text-[10px] text-muted-foreground">Distinct values avg</p>
                            </GlassCard>

                            <GlassCard className="p-6 space-y-2" variant="subtle">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    Consistency
                                </span>
                                <div className="text-2xl font-bold">{qualityScore.consistency}%</div>
                                <p className="text-[10px] text-muted-foreground">Outlier-free columns</p>
                            </GlassCard>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column Quality Chart */}
                        <GlassCard className="p-6 lg:col-span-2" variant="subtle">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm uppercase tracking-tight">Column Quality Scores</h3>
                                <Badge variant="outline" className="text-[9px]">Click to explore</Badge>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={columnAnalytics.slice(0, 12)} onClick={(data: any) => {
                                        if (data?.activePayload?.[0]?.payload) {
                                            setSelectedColumn(data.activePayload[0].payload.name);
                                        }
                                    }}>
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 9, fill: '#a1a1aa' }}
                                            axisLine={{ stroke: '#1e1e2e' }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 9, fill: '#a1a1aa' }}
                                            axisLine={{ stroke: '#1e1e2e' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#0a0a0f',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="qualityScore" radius={[4, 4, 0, 0]}>
                                            {columnAnalytics.slice(0, 12).map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={entry.qualityScore >= 80 ? '#10b981' :
                                                        entry.qualityScore >= 60 ? '#f59e0b' : '#ef4444'}
                                                    className="cursor-pointer hover:opacity-80"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        {/* Insights Panel */}
                        <div className="space-y-4">
                            {/* Outliers */}
                            <GlassCard className="p-4" variant="subtle">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                                    <h4 className="font-bold text-xs uppercase tracking-tight">Outliers Detected</h4>
                                </div>
                                {outlierColumns.length === 0 ? (
                                    <div className="flex items-center gap-2 text-primary text-xs">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        No outliers detected
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {outlierColumns.slice(0, 3).map(col => (
                                            <div key={col.name} className="flex items-center justify-between text-xs">
                                                <span className="font-mono truncate">{col.name}</span>
                                                <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                                                    {col.outliers?.count} outliers
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>

                            {/* Type Suggestions */}
                            <GlassCard className="p-4" variant="subtle">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="h-4 w-4 text-blue-400" />
                                    <h4 className="font-bold text-xs uppercase tracking-tight">Type Suggestions</h4>
                                </div>
                                {suggestionColumns.length === 0 ? (
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                        All types optimally detected
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {suggestionColumns.slice(0, 3).map(col => (
                                            <div key={col.name} className="flex items-center justify-between text-xs">
                                                <span className="font-mono truncate">{col.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">{col.type}</span>
                                                    <ArrowUpRight className="h-3 w-3" />
                                                    <span className="text-blue-400">{col.suggestedType}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>

                    {/* Selected Column Details */}
                    {selectedAnalytics && (
                        <GlassCard className="p-6" variant="subtle">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/20">
                                        <Database className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{selectedAnalytics.name}</h3>
                                        <Badge variant="outline" className="text-[9px] font-mono">
                                            {selectedAnalytics.type}
                                        </Badge>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedColumn(null)}>
                                    Close
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">Quality</span>
                                    <p className="text-xl font-bold">{selectedAnalytics.qualityScore}/100</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">Nulls</span>
                                    <p className="text-xl font-bold">{selectedAnalytics.nullPercentage.toFixed(1)}%</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">Distinct</span>
                                    <p className="text-xl font-bold">{selectedAnalytics.distinctCount.toLocaleString()}</p>
                                </div>
                                {selectedAnalytics.outliers && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase">Outliers</span>
                                        <p className="text-xl font-bold text-orange-400">{selectedAnalytics.outliers.count}</p>
                                    </div>
                                )}
                            </div>

                            {selectedAnalytics.histogram && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase mb-3">Distribution</h4>
                                    <div className="h-32">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={selectedAnalytics.histogram}>
                                                <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {selectedAnalytics.statistics && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-bold uppercase mb-3">Statistics</h4>
                                    <div className="grid grid-cols-4 gap-4 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Min</span>
                                            <p className="font-mono">{selectedAnalytics.statistics.min.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Max</span>
                                            <p className="font-mono">{selectedAnalytics.statistics.max.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Mean</span>
                                            <p className="font-mono">{selectedAnalytics.statistics.mean.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Std Dev</span>
                                            <p className="font-mono">{selectedAnalytics.statistics.stddev.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    )}

                    {/* Correlation Matrix */}
                    {correlation && correlation.columns.length >= 2 && (
                        <GlassCard className="p-6" variant="subtle">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-4 w-4 text-secondary" />
                                <h3 className="font-bold text-sm uppercase tracking-tight">Correlation Matrix</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-left text-muted-foreground"></th>
                                            {correlation.columns.map(col => (
                                                <th key={col} className="p-2 text-center font-mono truncate max-w-[80px]">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {correlation.matrix.map((row, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-mono text-muted-foreground truncate max-w-[80px]">
                                                    {correlation.columns[i]}
                                                </td>
                                                {row.map((val, j) => (
                                                    <td
                                                        key={j}
                                                        className="p-2 text-center"
                                                        style={{
                                                            backgroundColor: `rgba(${val > 0 ? '16, 185, 129' : '239, 68, 68'}, ${Math.abs(val) * 0.5})`
                                                        }}
                                                    >
                                                        {val.toFixed(2)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}
                </>
            )}
        </div>
    );
}
