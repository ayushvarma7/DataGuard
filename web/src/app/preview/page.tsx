"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/app/FileUpload";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { duckdbService } from "@/lib/duckdb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export default function PreviewPage() {
    const [data, setData] = useState<any[] | null>(null);
    const [rowCount, setRowCount] = useState(0);
    const [tableName, setTableName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUploadSuccess = async (name: string, count: number) => {
        setTableName(name);
        setRowCount(count);

        try {
            const results = await duckdbService.query(`SELECT * FROM "${name}" LIMIT 5`);
            setData(results);
        } catch (err) {
            console.error("Preview failed:", err);
        }
    };

    const loadSampleData = async () => {
        setLoading(true);
        try {
            // Small TPC-H sample
            const response = await fetch("https://raw.githubusercontent.com/duckdb/duckdb-wasm/main/packages/duckdb-wasm/test/data/tpch/0.01/parquet/lineitem.parquet");
            const blob = await response.blob();
            const file = new File([blob], "lineitem.parquet", { type: "application/octet-stream" });
            const count = await duckdbService.loadFile(file, "sample_data");
            await handleUploadSuccess("sample_data", count);
        } catch (err) {
            console.error("Sample load failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8 space-y-12 pb-32">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gradient-animated">Backend Connection Test</h1>
                <p className="text-muted-foreground">Everything processed client-side with DuckDB-WASM</p>
                <div className="pt-2 flex justify-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSampleData}
                        disabled={loading}
                        className="border-primary/20 hover:bg-primary/5"
                    >
                        <Database className="mr-2 h-4 w-4 text-primary" />
                        {loading ? "Loading..." : "Try with sample Parquet data"}
                    </Button>
                </div>
            </div>

            <FileUpload onUploadSuccess={handleUploadSuccess} />

            {tableName && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassCard className="p-6 text-center">
                            <div className="text-sm text-muted-foreground mb-1 font-mono">Table Name</div>
                            <div className="text-2xl font-mono font-bold text-primary">{tableName}</div>
                        </GlassCard>
                        <GlassCard className="p-6 text-center">
                            <div className="text-sm text-muted-foreground mb-1 font-mono">Total Rows</div>
                            <div className="text-2xl font-bold text-secondary">
                                <AnimatedCounter value={rowCount} />
                            </div>
                        </GlassCard>
                    </div>

                    {data && (
                        <GlassCard className="overflow-hidden border-white/5">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Data Preview (Top 5)</h3>
                                <span className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">SUCCESS</span>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
                                            {Object.keys(data[0] || {}).map((key) => (
                                                <TableHead key={key} className="text-muted-foreground font-mono text-[10px] h-10">
                                                    {key}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, i) => (
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
                    )}
                </div>
            )}
        </div>
    );
}
