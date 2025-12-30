"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import {
    GitCompare,
    CheckCircle2,
    XCircle,
    ArrowRight,
    AlertTriangle,
    Plus,
    Minus,
    RefreshCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { compareSchemas, SchemaComparisonResult, ColumnDiff } from "@/lib/schema-comparison";
import {
    detectPotentialRelationships,
    checkReferentialIntegrity,
    PotentialRelationship,
    IntegrityCheckResult
} from "@/lib/referential-integrity";

export default function ComparePage() {
    const { tables, activeTable } = useData();
    const [sourceTable, setSourceTable] = useState<string | null>(null);
    const [targetTable, setTargetTable] = useState<string | null>(null);
    const [comparison, setComparison] = useState<SchemaComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);

    // Referential Integrity
    const [relationships, setRelationships] = useState<PotentialRelationship[]>([]);
    const [integrityResults, setIntegrityResults] = useState<IntegrityCheckResult[]>([]);
    const [loadingIntegrity, setLoadingIntegrity] = useState(false);

    const tableList = Object.keys(tables);

    useEffect(() => {
        if (tableList.length >= 2 && !sourceTable) {
            setSourceTable(tableList[0]);
            setTargetTable(tableList[1]);
        }
    }, [tableList, sourceTable]);

    useEffect(() => {
        async function detectRelationships() {
            if (tableList.length >= 2) {
                const rels = await detectPotentialRelationships(tableList);
                setRelationships(rels);
            }
        }
        detectRelationships();
    }, [tableList]);

    const handleCompare = async () => {
        if (!sourceTable || !targetTable) return;
        setLoading(true);
        try {
            const result = await compareSchemas(sourceTable, targetTable);
            setComparison(result);
        } catch (err) {
            console.error("Comparison failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIntegrity = async (rel: PotentialRelationship) => {
        setLoadingIntegrity(true);
        try {
            const result = await checkReferentialIntegrity(
                rel.sourceTable,
                rel.sourceColumn,
                rel.targetTable,
                rel.targetColumn
            );
            setIntegrityResults(prev => [...prev.filter(r =>
                !(r.sourceTable === rel.sourceTable && r.sourceColumn === rel.sourceColumn)
            ), result]);
        } catch (err) {
            console.error("Integrity check failed:", err);
        } finally {
            setLoadingIntegrity(false);
        }
    };

    const getStatusIcon = (status: ColumnDiff['status']) => {
        switch (status) {
            case 'match': return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
            case 'added': return <Plus className="h-3.5 w-3.5 text-blue-400" />;
            case 'removed': return <Minus className="h-3.5 w-3.5 text-red-500" />;
            case 'type_changed': return <RefreshCcw className="h-3.5 w-3.5 text-orange-400" />;
        }
    };

    const getStatusBadge = (status: ColumnDiff['status']) => {
        const styles = {
            match: 'bg-primary/20 text-primary border-primary/30',
            added: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            removed: 'bg-red-500/20 text-red-400 border-red-500/30',
            type_changed: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        };
        return styles[status];
    };

    if (tableList.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <GitCompare className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">Schema Comparison</h2>
                <p className="text-muted-foreground max-w-sm">
                    Upload at least two datasets to compare schemas and check referential integrity.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Schema Comparison</h1>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                    Compare schemas & check relationships
                </p>
            </div>

            {/* Table Selectors */}
            <GlassCard className="p-6" variant="subtle">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                            Source Table
                        </label>
                        <select
                            value={sourceTable || ''}
                            onChange={(e) => setSourceTable(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {tableList.map(t => (
                                <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>
                            ))}
                        </select>
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />

                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                            Target Table
                        </label>
                        <select
                            value={targetTable || ''}
                            onChange={(e) => setTargetTable(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {tableList.filter(t => t !== sourceTable).map(t => (
                                <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>
                            ))}
                        </select>
                    </div>

                    <Button
                        onClick={handleCompare}
                        className="md:mt-5"
                        disabled={loading || !sourceTable || !targetTable}
                    >
                        {loading ? "Comparing..." : "Compare Schemas"}
                    </Button>
                </div>
            </GlassCard>

            {/* Comparison Results */}
            {comparison && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Summary */}
                    <GlassCard className="p-6" variant="subtle">
                        <h3 className="font-bold text-sm uppercase tracking-tight mb-4">Summary</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Compatible</span>
                                {comparison.isCompatible ? (
                                    <Badge className="bg-primary/20 text-primary border-primary/30">Yes</Badge>
                                ) : (
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">No</Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Matching</span>
                                <span className="font-mono text-xs">{comparison.summary.matchingColumns}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Added</span>
                                <span className="font-mono text-xs text-blue-400">{comparison.summary.addedColumns}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Removed</span>
                                <span className="font-mono text-xs text-red-400">{comparison.summary.removedColumns}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Type Changes</span>
                                <span className="font-mono text-xs text-orange-400">{comparison.summary.typeChanges}</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Diff View */}
                    <GlassCard className="p-6 lg:col-span-2" variant="subtle">
                        <h3 className="font-bold text-sm uppercase tracking-tight mb-4">Column Diff</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                            {comparison.differences.map((diff) => (
                                <div
                                    key={diff.column}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border",
                                        diff.status === 'match' && "border-white/5 bg-white/[0.02]",
                                        diff.status === 'added' && "border-blue-500/20 bg-blue-500/5",
                                        diff.status === 'removed' && "border-red-500/20 bg-red-500/5",
                                        diff.status === 'type_changed' && "border-orange-500/20 bg-orange-500/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(diff.status)}
                                        <span className="font-mono text-sm">{diff.column}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {diff.sourceType && (
                                            <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                                                {diff.sourceType}
                                            </span>
                                        )}
                                        {diff.status === 'type_changed' && (
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        )}
                                        {diff.targetType && diff.status === 'type_changed' && (
                                            <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                                                {diff.targetType}
                                            </span>
                                        )}
                                        <Badge variant="outline" className={cn("text-[9px]", getStatusBadge(diff.status))}>
                                            {diff.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Referential Integrity */}
            {relationships.length > 0 && (
                <GlassCard className="p-6" variant="subtle">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-4 w-4 text-secondary" />
                        <h3 className="font-bold text-sm uppercase tracking-tight">Potential Relationships</h3>
                    </div>
                    <div className="space-y-3">
                        {relationships.map((rel, i) => {
                            const result = integrityResults.find(
                                r => r.sourceTable === rel.sourceTable && r.sourceColumn === rel.sourceColumn
                            );
                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]"
                                >
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-mono">{rel.sourceTable}.{rel.sourceColumn}</span>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-mono">{rel.targetTable}.{rel.targetColumn}</span>
                                        <Badge variant="outline" className={cn(
                                            "text-[9px]",
                                            rel.confidence === 'high' ? "text-primary border-primary/30" :
                                                rel.confidence === 'medium' ? "text-orange-400 border-orange-400/30" :
                                                    "text-muted-foreground border-white/10"
                                        )}>
                                            {rel.confidence}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {result && (
                                            result.passed ? (
                                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px]">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px]">
                                                    <XCircle className="h-3 w-3 mr-1" /> {result.orphanCount} orphans
                                                </Badge>
                                            )
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={loadingIntegrity}
                                            onClick={() => handleCheckIntegrity(rel)}
                                            className="text-[10px] h-7"
                                        >
                                            Check
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
