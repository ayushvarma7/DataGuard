"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { duckdbService } from "@/lib/duckdb";

interface DataState {
    activeTable: string | null;
    rowCount: number;
    schema: any[] | null;
    uploadStatus: "idle" | "processing" | "success" | "error";
    error: string | null;
    baselines: Record<string, any[]>;
    rules: any[];
}

interface DataContextType extends DataState {
    setTable: (name: string, count: number) => Promise<void>;
    refreshSchema: () => Promise<void>;
    resetData: () => void;
    setUploadStatus: (status: DataState["uploadStatus"]) => void;
    setError: (msg: string | null) => void;
    setBaseline: (tableName: string, schema: any[]) => void;
    setRules: (rules: any[]) => void;
    getActiveBaseline: () => any[] | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = "dataguard_state";

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [state, setState] = useState<DataState>({
        activeTable: null,
        rowCount: 0,
        schema: null,
        uploadStatus: "idle",
        error: null,
        baselines: {},
        rules: [],
    });

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(prev => ({
                    ...prev,
                    baselines: parsed.baselines || {},
                    rules: parsed.rules || [],
                    // We don't persist activeTable/rowCount/schema because WASM memory is volatile
                }));
            } catch (e) {
                console.error("Failed to load state from localStorage:", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save state to localStorage on changes
    useEffect(() => {
        if (isLoaded) {
            const toSave = {
                baselines: state.baselines,
                rules: state.rules,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
    }, [state.baselines, state.rules, isLoaded]);

    const setTable = useCallback(async (name: string, count: number) => {
        setState(prev => ({ ...prev, activeTable: name, rowCount: count, uploadStatus: "success", error: null }));

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
        setState(prev => ({
            ...prev,
            activeTable: null,
            rowCount: 0,
            schema: null,
            uploadStatus: "idle",
            error: null,
        }));
    }, []);

    const setUploadStatus = useCallback((status: DataState["uploadStatus"]) => {
        setState(prev => ({ ...prev, uploadStatus: status }));
    }, []);

    const setError = useCallback((msg: string | null) => {
        setState(prev => ({ ...prev, error: msg }));
    }, []);

    const setBaseline = useCallback((tableName: string, schema: any[]) => {
        setState(prev => ({
            ...prev,
            baselines: { ...prev.baselines, [tableName]: schema }
        }));
    }, []);

    const setRules = useCallback((rules: any[]) => {
        setState(prev => ({ ...prev, rules }));
    }, []);

    const getActiveBaseline = useCallback(() => {
        if (!state.activeTable) return null;
        return state.baselines[state.activeTable] || null;
    }, [state.activeTable, state.baselines]);

    if (!isLoaded) return null;

    return (
        <DataContext.Provider value={{
            ...state,
            setTable,
            refreshSchema,
            resetData,
            setUploadStatus,
            setError,
            setBaseline,
            setRules,
            getActiveBaseline
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
