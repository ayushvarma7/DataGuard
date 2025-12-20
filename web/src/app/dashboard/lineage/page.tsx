"use client";

import React, { useMemo } from "react";
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
import {
    FileText,
    Database,
    ShieldCheck,
    Layout,
    GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Node Components
const CustomNode = ({ data, selected }: NodeProps) => {
    const Icon = data.icon;
    return (
        <div className={cn(
            "px-4 py-3 rounded-xl border bg-[#0a0a0f]/80 backdrop-blur-xl shadow-2xl min-w-[200px] transition-all duration-300",
            selected ? "border-primary shadow-primary/20 scale-105" : "border-white/10"
        )}>
            <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary border-none" />
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-white/5 border border-white/10", data.color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{data.label}</span>
                    <span className="text-sm font-bold text-foreground truncate max-w-[140px]">{data.name}</span>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary border-none" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

export default function LineagePage() {
    const { activeTable } = useData();

    const nodes: Node[] = useMemo(() => {
        if (!activeTable) return [];

        return [
            {
                id: "source-1",
                type: "custom",
                position: { x: 0, y: 100 },
                data: { label: "Source File", name: activeTable, icon: FileText, color: "text-blue-400" },
            },
            {
                id: "engine-1",
                type: "custom",
                position: { x: 300, y: 100 },
                data: { label: "Compute Engine", name: "DuckDB WASM", icon: Database, color: "text-primary" },
            },
            {
                id: "view-1",
                type: "custom",
                position: { x: 600, y: 25 },
                data: { label: "Output View", name: "Data Preview", icon: Layout, color: "text-secondary" },
            },
            {
                id: "view-2",
                type: "custom",
                position: { x: 600, y: 175 },
                data: { label: "Quality Layer", name: "Validation Report", icon: ShieldCheck, color: "text-orange-400" },
            },
        ];
    }, [activeTable]);

    const edges: Edge[] = useMemo(() => {
        if (!activeTable) return [];
        return [
            { id: "e1-2", source: "source-1", target: "engine-1", animated: true, style: { stroke: "#10b981", strokeWidth: 2 } },
            { id: "e2-3", source: "engine-1", target: "view-1", animated: true, style: { strokeWidth: 2, opacity: 0.5 } },
            { id: "e2-4", source: "engine-1", target: "view-2", animated: true, style: { strokeWidth: 2, opacity: 0.5 } },
        ];
    }, [activeTable]);

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <GitBranch className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">No Active Dataset</h2>
                <p className="text-muted-foreground max-w-sm">
                    Load a dataset to generate its provenance and lineage graph.
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
