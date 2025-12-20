"use client";

import React, { useState, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/GlassCard";
import { duckdbService } from "@/lib/duckdb";
import { useData } from "@/context/DataContext";

interface FileUploadProps {
    onUploadSuccess?: (tableName: string, rowCount: number) => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
    const { uploadStatus: status, setUploadStatus: setStatus, setError, error } = useData();
    const [fileName, setFileName] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFileName(file.name);
        setStatus("processing");
        setError(null);

        try {
            // Use filename as table name (sanitized)
            const tableName = file.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
            const count = await duckdbService.loadFile(file, tableName);

            setStatus("success");
            onUploadSuccess?.(tableName, count);
        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setError(err.message || "Failed to process file");
        }
    }, [onUploadSuccess, setStatus, setError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
            "application/parquet": [".parquet"],
            "application/octet-stream": [".parquet"],
        },
        multiple: false,
    });

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer transition-all duration-300",
                    status === "processing" && "pointer-events-none opacity-80"
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
                        "rounded-lg p-12 border border-dashed flex flex-col items-center gap-6 transition-colors",
                        isDragActive ? "border-primary/50 bg-primary/5" : "border-white/10 bg-black/40"
                    )}>
                        <input {...getInputProps()} />

                        <div className="relative">
                            {status === "processing" ? (
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            ) : status === "success" ? (
                                <div className="bg-primary/20 p-5 rounded-2xl border border-primary/20">
                                    <CheckCircle className="h-10 w-10 text-primary" />
                                </div>
                            ) : status === "error" ? (
                                <div className="bg-red-500/20 p-5 rounded-2xl border border-red-500/20">
                                    <AlertCircle className="h-10 w-10 text-red-500" />
                                </div>
                            ) : (
                                <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                    <Upload className="h-10 w-10 text-primary" />
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">
                                {status === "processing" ? "Processing with DuckDB..." :
                                    status === "success" ? "File Ready!" :
                                        status === "error" ? "Upload Failed" :
                                            isDragActive ? "Drop it here!" : "Upload Data File"}
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                {status === "processing" ? `Loading ${fileName} into WASM memory...` :
                                    status === "success" ? `Successfully loaded ${fileName}` :
                                        status === "error" ? error :
                                            "Select a CSV or Parquet file to instantly run data quality checks locally."}
                            </p>
                        </div>

                        {status === "idle" && (
                            <div className="flex gap-4 pt-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <File className="h-3 w-3" />
                                    CSV or Parquet
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="h-1 w-1 rounded-full bg-primary" />
                                    100% Client-side
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
