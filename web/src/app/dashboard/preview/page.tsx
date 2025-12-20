"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { duckdbService } from "@/lib/duckdb";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    ChevronLeft,
    ChevronRight,
    Database,
    Download,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 100;

export default function PreviewPage() {
    const { activeTable, rowCount } = useData();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);

    const fetchData = useCallback(async (p: number) => {
        if (!activeTable) return;
        setLoading(true);
        try {
            const offset = p * PAGE_SIZE;
            const results = await duckdbService.query(`SELECT * FROM "${activeTable}" LIMIT ${PAGE_SIZE} OFFSET ${offset}`);
            setData(results);
        } catch (err) {
            console.error("Preview fetching failed:", err);
        } finally {
            setLoading(false);
        }
    }, [activeTable]);

    useEffect(() => {
        fetchData(page);
    }, [fetchData, page]);

    const totalPages = Math.ceil(rowCount / PAGE_SIZE);

    const exportCSV = async () => {
        if (!activeTable) return;
        try {
            const result = await duckdbService.query(`COPY "${activeTable}" TO 'export.csv' (HEADER, DELIMITER ',')`);
            // In DuckDB-WASM, we have to read the file from the virtual file system
            // For now, let's just alert success of the query as a placeholder
            // and I will implement the actual file download logic in a future step if needed.
            alert("CSV exported to DuckDB virtual filesystem. (Actual download logic in progress)");
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Database className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">No Data Loaded</h2>
                <p className="text-muted-foreground max-w-sm">
                    Please upload a dataset to enable the interactive preview.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Data Preview</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                        Dataset: {activeTable} • {rowCount.toLocaleString()} Rows
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportCSV} className="border-white/10 hover:bg-white/5">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <GlassCard className="overflow-hidden border-white/5 flex flex-col min-h-[600px]" variant="subtle">
                <div className="overflow-x-auto flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
                                {data.length > 0 && Object.keys(data[0]).map((key) => (
                                    <TableHead key={key} className="text-muted-foreground font-mono text-[10px] h-10 whitespace-nowrap px-4 border-r border-white/5 last:border-0 uppercase tracking-tighter">
                                        {key}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 15 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {data.length > 0 ? Object.keys(data[0]).map((k) => (
                                            <TableCell key={k} className="p-4"><div className="h-2 w-full bg-white/5 animate-pulse rounded" /></TableCell>
                                        )) : <TableCell className="p-4" colSpan={10}><div className="h-2 w-full bg-white/5 animate-pulse rounded" /></TableCell>}
                                    </TableRow>
                                ))
                            ) : data.map((row, i) => (
                                <TableRow key={i} className="border-white/5 hover:bg-white/[0.01] transition-colors leading-none">
                                    {Object.values(row).map((val: any, j) => (
                                        <TableCell key={j} className="font-mono text-[10px] py-3 px-4 text-foreground/80 border-r border-white/5 last:border-0 truncate max-w-[200px]">
                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        <span>Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, rowCount)} of {rowCount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={page === 0 || loading}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded font-mono text-xs">
                            {page + 1} / {totalPages || 1}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={page >= totalPages - 1 || loading}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
