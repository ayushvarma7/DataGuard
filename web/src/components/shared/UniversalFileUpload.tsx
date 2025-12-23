"use client";

import React, { useState, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, Loader2, Database } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/GlassCard";
import { detectFormat, FormatDetectionResult } from "@/lib/format-detector";
import { getProcessor, ProcessedTable } from "@/lib/file-processor";
import { TableSelectorModal } from "./TableSelectorModal";
import { FormatBadge } from "./FormatBadge";
import { useData } from "@/context/DataContext";
import { useRouter } from "next/navigation";

interface UniversalFileUploadProps {
    onUploadSuccess?: (tables: ProcessedTable[]) => void;
    redirectToDashboard?: boolean;
}

export function UniversalFileUpload({ onUploadSuccess, redirectToDashboard = false }: UniversalFileUploadProps) {
    const { setUploadStatus, setError, error, addTable } = useData();
    const router = useRouter();

    const [status, setStatusState] = useState<"idle" | "detecting" | "selecting" | "processing" | "success" | "error">("idle");
    const [file, setFile] = useState<File | null>(null);
    const [detection, setDetection] = useState<FormatDetectionResult | null>(null);
    const [availableTables, setAvailableTables] = useState<string[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    const handleProcess = useCallback(async (targetFile: File, targetDetection: FormatDetectionResult, tablesToProcess?: string[]) => {
        setStatusState("processing");
        setUploadStatus("processing");

        try {
            const processor = await getProcessor(targetDetection.format);

            const results: ProcessedTable[] = [];

            if (tablesToProcess && tablesToProcess.length > 0) {
                // Process specific tables for Excel/SQLite/SQL
                for (const tableName of tablesToProcess) {
                    const tableResults = await processor.process(targetFile, {
                        sheet: targetDetection.format === 'excel' ? tableName : undefined,
                        table: (targetDetection.format === 'sqlite' || targetDetection.format === 'sql') ? tableName : undefined
                    });
                    results.push(...tableResults);
                }
            } else {
                // Process entire file (CSV/Parquet/JSON)
                const tableResults = await processor.process(targetFile);
                results.push(...tableResults);
            }

            // Add to global state
            for (const table of results) {
                addTable(table.name, table.rowCount, table.columns, table.sourceFormat);
            }

            setStatusState("success");
            setUploadStatus("success");
            onUploadSuccess?.(results);

            if (redirectToDashboard) {
                // Short delay to show success state
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);
            }
        } catch (err: any) {
            console.error(err);
            setStatusState("error");
            setUploadStatus("error");
            setError(err.message || "Failed to process file");
        }
    }, [addTable, onUploadSuccess, redirectToDashboard, router, setError, setUploadStatus]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const droppedFile = acceptedFiles[0];
        if (!droppedFile) return;

        setFile(droppedFile);
        setStatusState("detecting");
        setError(null);

        try {
            const result = await detectFormat(droppedFile);
            setDetection(result);

            // Check if format requires table selection
            if (['excel', 'sqlite', 'sql'].includes(result.format)) {
                setStatusState("selecting");
                const processor = await getProcessor(result.format);
                const tables = await processor.listTables(droppedFile);
                setAvailableTables(tables);
                setSelectedTables(tables.slice(0, 1)); // Default select first
            } else {
                // Auto-process CSV/Parquet/JSON
                await handleProcess(droppedFile, result);
            }
        } catch (err: any) {
            console.error(err);
            setStatusState("error");
            setError(err.message || "Failed to detect file format");
        }
    }, [handleProcess, setError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
    });

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer transition-all duration-300",
                    (status === "processing" || status === "detecting") && "pointer-events-none opacity-80"
                )}
            >
                <GlassCard
                    className={cn(
                        "p-1 overflow-hidden transition-all duration-300",
                        isDragActive ? "border-primary scale-[1.02]" : "border-white/10",
                        status === "error" ? "border-red-500/50" : "",
                        status === "success" ? "border-primary/50" : ""
                    )}
                >
                    <div className={cn(
                        "rounded-lg p-10 border border-dashed flex flex-col items-center gap-6 transition-colors",
                        isDragActive ? "border-primary/50 bg-primary/5" : "border-white/10 bg-black/40"
                    )}>
                        <input {...getInputProps()} />

                        <div className="relative">
                            {(status === "processing" || status === "detecting") ? (
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            ) : status === "success" ? (
                                <div className="bg-primary/20 p-5 rounded-2xl border border-primary/20">
                                    <CheckCircle className="h-10 w-10 text-primary" />
                                </div>
                            ) : status === "error" ? (
                                <div className="bg-red-500/20 p-5 rounded-2xl border border-red-500/20">
                                    <AlertCircle className="h-10 w-10 text-red-500" />
                                </div>
                            ) : status === "selecting" ? (
                                <div className="bg-amber-500/20 p-5 rounded-2xl border border-amber-500/20">
                                    <Database className="h-10 w-10 text-amber-500" />
                                </div>
                            ) : (
                                <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                    <Upload className="h-10 w-10 text-primary" />
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                                {status === "detecting" && "Detecting format..."}
                                {status === "processing" && "Processing with DuckDB..."}
                                {status === "selecting" && "Select Tables"}
                                {status === "success" && "Data Guarded!"}
                                {status === "error" && "Upload Failed"}
                                {status === "idle" && (isDragActive ? "Drop it here!" : "Upload Data File")}
                                {detection && status !== "idle" && status !== "detecting" && (
                                    <FormatBadge format={detection.format} />
                                )}
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                {status === "detecting" && `Analyzing ${file?.name}...`}
                                {status === "processing" && `Loading ${file?.name} into WASM memory...`}
                                {status === "selecting" && `Found ${availableTables.length} tables in ${file?.name}`}
                                {status === "success" && `Successfully loaded ${file?.name}`}
                                {status === "error" && (error || "Unknown error occurred")}
                                {status === "idle" && "Drop any CSV, Excel, Parquet, JSON, or SQLite file to instantly run data quality checks."}
                            </p>
                        </div>

                        {status === "idle" && (
                            <div className="flex flex-wrap justify-center gap-3 pt-2">
                                {['csv', 'parquet', 'excel', 'json', 'sqlite'].map((fmt) => (
                                    <FormatBadge key={fmt} format={fmt as any} className="opacity-60" />
                                ))}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {detection && (
                <TableSelectorModal
                    isOpen={status === "selecting"}
                    onClose={() => setStatusState("idle")}
                    title={detection.format === 'excel' ? 'Select Sheets' : 'Select Tables'}
                    description={`Choose which parts of "${file?.name}" you want to analyze.`}
                    tables={availableTables}
                    selectedTables={selectedTables}
                    onSelectionChange={setSelectedTables}
                    onConfirm={() => file && handleProcess(file, detection, selectedTables)}
                    multiple={true}
                />
            )}
        </div>
    );
}
