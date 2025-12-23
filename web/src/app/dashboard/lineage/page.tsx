"use client";

import React, { useMemo, useState, useEffect } from "react";
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    NodeProps,
    Edge,
    Node
} from "reactflow";
import "reactflow/dist/style.css";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { duckdbService } from "@/lib/duckdb";
import {
    FileText,
    Database,
    ShieldCheck,
    Layout,
    GitBranch,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// ... inside CustomNode
const CustomNode = ({ data, selected }: NodeProps) => {
    const Icon = data.icon;
    const isBroken = data.status === "broken";
    const isAtRisk = data.status === "at-risk";

    return (
        <div className={cn(
            "px-4 py-3 rounded-xl border bg-[#0a0a0f]/80 backdrop-blur-xl shadow-2xl min-w-[200px] transition-all duration-300",
            selected ? "border-primary shadow-primary/20 scale-105" : "border-white/10",
            isBroken && "border-red-500/50 shadow-red-500/10",
            isAtRisk && "border-orange-500/50 shadow-orange-500/10"
        )}>
            <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary border-none" />
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-lg bg-white/5 border border-white/10 relative",
                    data.color,
                    isBroken && "text-red-500 border-red-500/20",
                    isAtRisk && "text-orange-500 border-orange-500/20"
                )}>
                    <Icon className="h-5 w-5" />
                    {(isBroken || isAtRisk) && (
                        <div className={cn(
                            "absolute -top-1 -right-1 p-0.5 rounded-full",
                            isBroken ? "bg-red-500" : "bg-orange-500"
                        )}>
                            <AlertTriangle className="h-2 w-2 text-white" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{data.label}</span>
                    <span className="text-sm font-bold text-foreground truncate max-w-[140px]">{data.name}</span>
                </div>
            </div>
            {isBroken && (
                <div className="mt-2 pt-2 border-t border-red-500/10 text-[9px] text-red-400 font-bold uppercase tracking-tighter">
                    Pipe Broken: Structural Drift
                </div>
            )}
            {isAtRisk && (
                <div className="mt-2 pt-2 border-t border-orange-500/10 text-[9px] text-orange-400 font-bold uppercase tracking-tighter">
                    At Risk: Quality Drift
                </div>
            )}
            <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary border-none" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

export default function LineagePage() {
    const { activeTable, tables, baselines } = useData();
    const [driftStatus, setDriftStatus] = useState<"clean" | "at-risk" | "broken">("clean");

    const activeTableData = activeTable ? tables[activeTable] : null;
    const schema = activeTableData?.schema;
    const rowCount = activeTableData?.rowCount || 0;

    useEffect(() => {
        async function checkImpact() {
            if (!activeTable || !schema || Object.keys(baselines).length === 0) return;

            const baseline = baselines[activeTable] || Object.values(baselines)[0];
            if (!baseline) return;

            try {
                // Quick check for structural drift
                if (schema.length !== baseline.length) {
                    setDriftStatus("broken");
                    return;
                }

                // Check for null drift
                const nullQueries = schema.map(col => `sum(case when "${col.column_name}" is null then 1 else 0 end) as "${col.column_name}_nulls"`).join(", ");
                const sql = `SELECT ${nullQueries} FROM "${activeTable}"`;
                const res = await duckdbService.query(sql);

                let hasQualityDrift = false;
                schema.forEach(col => {
                    const currentNulls = Number(res[0][`${col.column_name}_nulls`]);
                    const currentPct = (currentNulls / rowCount) * 100;
                    const baselineCol = baseline.find((b: any) => b.name === col.column_name);
                    if (baselineCol && Math.abs(currentPct - baselineCol.nullPercentage) > 10) {
                        hasQualityDrift = true;
                    }
                });

                setDriftStatus(hasQualityDrift ? "at-risk" : "clean");
            } catch (e) {
                console.warn("Impact check failed", e);
            }
        }
        checkImpact();
    }, [activeTable, schema, baselines, rowCount]);

    const nodes: Node[] = useMemo(() => {
        const tableList = Object.values(tables);
        if (tableList.length === 0) return [];

        const sourceNodes: Node[] = tableList.map((t, i) => ({
            id: `source-${t.name}`,
            type: "custom",
            position: { x: 0, y: i * 150 },
            data: { label: "Source File", name: t.name, icon: FileText, color: "text-blue-400" },
        }));

        const centerY = (tableList.length - 1) * 75;

        const engineNode: Node = {
            id: "engine-1",
            type: "custom",
            position: { x: 300, y: centerY },
            data: {
                label: "Compute Engine",
                name: "DuckDB WASM",
                icon: Database,
                color: "text-primary",
                status: activeTable && driftStatus !== "clean" ? driftStatus : undefined
            },
        };

        const viewNodes: Node[] = [
            {
                id: "view-1",
                type: "custom",
                position: { x: 600, y: centerY - 100 },
                data: { label: "Output View", name: "Data Preview", icon: Layout, color: "text-secondary", status: activeTable && driftStatus !== "clean" ? driftStatus : undefined },
            },
            {
                id: "view-2",
                type: "custom",
                position: { x: 600, y: centerY + 100 },
                data: { label: "Quality Layer", name: "Validation Report", icon: ShieldCheck, color: "text-orange-400", status: activeTable && driftStatus !== "clean" ? driftStatus : undefined },
            },
        ];

        return [...sourceNodes, engineNode, ...viewNodes];
    }, [tables, activeTable, driftStatus]);

    const edges: Edge[] = useMemo(() => {
        const tableList = Object.values(tables);
        if (tableList.length === 0) return [];
        const edgeColor = driftStatus === "broken" ? "#ef4444" : driftStatus === "at-risk" ? "#f97316" : "#10b981";

        const sourceToEngineEdges: Edge[] = tableList.map((t) => ({
            id: `e-source-${t.name}`,
            source: `source-${t.name}`,
            target: "engine-1",
            animated: t.name === activeTable && driftStatus === "clean",
            style: {
                stroke: t.name === activeTable ? edgeColor : "#1e293b",
                strokeWidth: t.name === activeTable ? 2 : 1,
                opacity: t.name === activeTable ? 1 : 0.3
            }
        }));

        return [
            ...sourceToEngineEdges,
            { id: "e2-3", source: "engine-1", target: "view-1", animated: driftStatus === "clean", style: { stroke: edgeColor, strokeWidth: 2, opacity: driftStatus === "at-risk" ? 0.8 : 0.5 } },
            { id: "e2-4", source: "engine-1", target: "view-2", animated: driftStatus === "clean", style: { stroke: edgeColor, strokeWidth: 2, opacity: driftStatus === "at-risk" ? 0.8 : 0.5 } },
        ];
    }, [tables, activeTable, driftStatus]);

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <GitBranch className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">No Active Dataset</h2>
                <p className="text-muted-foreground max-w-sm">
                    Load a dataset (CSV, Excel, Parquet, JSON, or SQLite) to generate its provenance and lineage graph.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Lineage Tracking</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                        Tracking provenance for {activeTable}
                    </p>
                </div>
            </div>

            <GlassCard className="flex-1 min-h-[500px] relative overflow-hidden p-0 border-white/5" variant="subtle">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-dot-pattern"
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#1e1e2e" gap={20} />
                    <Controls className="bg-surface border-white/10" />
                </ReactFlow>
            </GlassCard>
        </div>
    );
}
