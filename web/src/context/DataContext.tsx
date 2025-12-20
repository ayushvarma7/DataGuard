"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { duckdbService } from "@/lib/duckdb";

interface DataState {
    activeTable: string | null;
    rowCount: number;
    schema: any[] | null;
    uploadStatus: "idle" | "processing" | "success" | "error";
    error: string | null;
}

interface DataContextType extends DataState {
    setTable: (name: string, count: number) => Promise<void>;
    refreshSchema: () => Promise<void>;
    resetData: () => void;
    setUploadStatus: (status: DataState["uploadStatus"]) => void;
    setError: (msg: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DataState>({
        activeTable: null,
        rowCount: 0,
        schema: null,
        uploadStatus: "idle",
        error: null,
    });

    const setTable = useCallback(async (name: string, count: number) => {
        setState(prev => ({ ...prev, activeTable: name, rowCount: count, uploadStatus: "success", error: null }));

        // Auto-fetch schema when table is set
        try {
            const schema = await duckdbService.getSchema(name);
            setState(prev => ({ ...prev, schema }));
        } catch (err) {
            console.error("Failed to fetch schema:", err);
        }
    }, []);

    const refreshSchema = useCallback(async () => {
        if (!state.activeTable) return;
        try {
            const schema = await duckdbService.getSchema(state.activeTable);
            setState(prev => ({ ...prev, schema }));
        } catch (err) {
            console.error("Failed to refresh schema:", err);
        }
    }, [state.activeTable]);

    const resetData = useCallback(() => {
        setState({
            activeTable: null,
            rowCount: 0,
            schema: null,
            uploadStatus: "idle",
            error: null,
        });
    }, []);

    const setUploadStatus = useCallback((status: DataState["uploadStatus"]) => {
        setState(prev => ({ ...prev, uploadStatus: status }));
    }, []);

    const setError = useCallback((msg: string | null) => {
        setState(prev => ({ ...prev, error: msg }));
    }, []);

    return (
        <DataContext.Provider value={{
            ...state,
            setTable,
            refreshSchema,
            resetData,
            setUploadStatus,
            setError
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}
