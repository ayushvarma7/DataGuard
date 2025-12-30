"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { duckdbService } from "@/lib/duckdb";
import {
    Terminal,
    Play,
    Database,
    Table as TableIcon,
    Download,
    Trash2,
    Sparkles,
    Search,
    Copy,
    Check
} from "lucide-react";
import { copyToClipboard, exportTable } from "@/lib/format-export";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function SQLLabPage() {
    const { activeTable, tables } = useData();
    const [query, setQuery] = useState(activeTable ? `SELECT * FROM "${activeTable}" LIMIT 10` : "");
    const [results, setResults] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = async (format: 'json' | 'csv') => {
        if (!results) return;
        const success = await copyToClipboard(results, format);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const runQuery = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await duckdbService.query(query);
            setResults(res);
        } catch (err: any) {
            setError(err.message || "Query failed");
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const tableList = Object.keys(tables);
    const secondTable = tableList.length > 1 ? tableList.find(t => t !== activeTable) : null;

    const snippets = [
        { name: "Preview", sql: activeTable ? `SELECT * FROM "${activeTable}" LIMIT 10` : "" },
        { name: "Schema", sql: activeTable ? `DESCRIBE "${activeTable}"` : "" },
        { name: "Count", sql: activeTable ? `SELECT COUNT(*) as total FROM "${activeTable}"` : "" },
        {
            name: "Stats", sql: activeTable ? `SELECT 
  COUNT(*) as rows,
  COUNT(DISTINCT *) as unique_rows
FROM "${activeTable}"` : ""
        },
        ...(secondTable ? [{
            name: "Cross JOIN",
            sql: `SELECT a.*, b.* 
FROM "${activeTable}" a
JOIN "${secondTable}" b ON TRUE
LIMIT 10`
        }] : []),
        {
            name: "Nulls", sql: activeTable ? `SELECT * FROM "${activeTable}" 
WHERE ${tables[activeTable]?.schema?.[0]?.column_name ? `"${tables[activeTable].schema[0].column_name}" IS NULL` : 'FALSE'} LIMIT 5` : ""
        },
    ];

    if (Object.keys(tables).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Terminal className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">SQL Lab</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    Please load a dataset to start querying and exploring with SQL.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">SQL Lab</h1>
                    <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">Interactive Database Sandbox</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery("")}
                        className="border-white/10 hover:bg-white/5"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                    <Button
                        onClick={runQuery}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
                    >
                        {loading ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Play className="mr-2 h-4 w-4" /> Run Query</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Query Area */}
                <div className="lg:col-span-3 space-y-4">
                    <GlassCard className="p-0 border-white/10 overflow-hidden" variant="subtle">
                        <div className="bg-white/[0.03] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SQL EDITOR</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-red-500/50" />
                                <div className="h-2 w-2 rounded-full bg-orange-500/50" />
                                <div className="h-2 w-2 rounded-full bg-green-500/50" />
                            </div>
                        </div>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full h-48 bg-black/40 p-6 font-mono text-base focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/30 text-white leading-relaxed custom-scrollbar selection:bg-primary/30"
                            placeholder="Type your SQL query here... e.g., SELECT * FROM orders"
                            spellCheck={false}
                        />
                    </GlassCard>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex gap-3 animate-in fade-in slide-in-from-top-2">
                            <Trash2 className="h-4 w-4 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* Results Area */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="font-bold text-sm tracking-tight inline-flex items-center gap-2">
                                Result Set
                                {results && <span className="text-[10px] font-normal text-muted-foreground">({results.length} rows)</span>}
                            </h3>
                            {results && results.length > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy('csv')}
                                        className="h-8 text-[10px] bg-white/[0.02] border-white/10 hover:bg-white/5"
                                    >
                                        {copied ? <Check className="mr-2 h-3 w-3 text-primary" /> : <Copy className="mr-2 h-3 w-3" />}
                                        Copy TSV
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportTable({ format: 'csv', tableName: activeTable || 'query_results', filename: 'query_results.csv' })}
                                        className="h-8 text-[10px] bg-white/[0.02] border-white/10 hover:bg-white/5"
                                    >
                                        <Download className="mr-2 h-3.5 w-3.5" />
                                        Export CSV
                                    </Button>
                                </div>
                            )}
                        </div>

                        {!results && !loading && !error && (
                            <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                <Database className="h-10 w-10 text-muted-foreground/10 mx-auto mb-4" />
                                <p className="text-muted-foreground text-xs italic">Run a query to see results here</p>
                            </div>
                        )}

                        {results && results.length > 0 && (
                            <GlassCard className="overflow-hidden border-white/5">
                                <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.04]">
                                                {Object.keys(results[0]).map((key) => (
                                                    <TableHead key={key} className="text-muted-foreground font-mono text-[10px] h-10 px-4">
                                                        {key}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((row, i) => (
                                                <TableRow key={i} className="border-white/5 hover:bg-white/[0.01]">
                                                    {Object.values(row).map((val: any, j) => (
                                                        <TableCell key={j} className="font-mono text-[10px] py-3 px-4 text-foreground/80">
                                                            {val === null ? <span className="text-muted-foreground/30 italic">NULL</span> : String(val)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </GlassCard>
                        )}

                        {results && results.length === 0 && !loading && (
                            <div className="py-10 text-center border border-white/5 rounded-2xl">
                                <p className="text-muted-foreground text-xs">Query returned no results.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Tables & Snippets */}
                <div className="space-y-8">
                    {/* Tables Registry */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Database className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-sm tracking-tight uppercase">Tables</h3>
                        </div>
                        <div className="space-y-1">
                            {Object.values(tables).map((t) => (
                                <div
                                    key={t.name}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between group transition-colors cursor-pointer",
                                        activeTable === t.name ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5"
                                    )}
                                    onClick={() => setQuery(`SELECT * FROM "${t.name}" LIMIT 10`)}
                                >
                                    <span className="truncate">{t.name}</span>
                                    <TableIcon className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lab Snippets */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-sm tracking-tight uppercase">Snippets</h3>
                        </div>

                        <div className="space-y-3">
                            {snippets.map((snippet, i) => (
                                <GlassCard
                                    key={i}
                                    className="p-4 border-white/5 group hover:border-primary/40 transition-all duration-300 cursor-pointer"
                                    variant="subtle"
                                    onClick={() => setQuery(snippet.sql)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[11px] font-bold text-foreground/90 tracking-tight">{snippet.name}</h4>
                                        <Play className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <code className="text-[9px] font-mono text-muted-foreground line-clamp-2 bg-black/20 p-2 rounded block">
                                        {snippet.sql}
                                    </code>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Pro Tip</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            DuckDB-WASM supports full relational SQL, including window functions and CTEs. Perfect for complex profiling.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
