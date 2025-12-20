"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { duckdbService } from "@/lib/duckdb";

interface LoadedTable {
    name: string;
    rowCount: number;
    schema: any[];
}

interface DataState {
    activeTable: string | null;
    tables: Record<string, LoadedTable>;
    uploadStatus: "idle" | "processing" | "success" | "error";
    error: string | null;
    baselines: Record<string, any[]>;
    rules: Record<string, any[]>; // Rules grouped by table
}

interface DataContextType extends DataState {
    addTable: (name: string, count: number, schema: any[]) => void;
    setActiveTable: (name: string | null) => void;
    removeTable: (name: string) => void;
    resetData: () => void;
    setUploadStatus: (status: DataState["uploadStatus"]) => void;
    setError: (msg: string | null) => void;
    setBaseline: (tableName: string, schema: any[]) => void;
    setRules: (tableName: string, rules: any[]) => void;
    getActiveBaseline: () => any[] | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = "dataguard_state_v2"; // Bump version for schema change

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [state, setState] = useState<DataState>({
        activeTable: null,
        tables: {},
        uploadStatus: "idle",
        error: null,
        baselines: {},
        rules: {},
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
                    rules: parsed.rules || {},
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

    const addTable = useCallback((name: string, count: number, schema: any[]) => {
        setState(prev => {
            const newTables = { ...prev.tables, [name]: { name, rowCount: count, schema } };
            return {
                ...prev,
                tables: newTables,
                activeTable: prev.activeTable || name,
                uploadStatus: "success",
                error: null
            };
        });
    }, []);

    const setActiveTable = useCallback((name: string | null) => {
        setState(prev => ({ ...prev, activeTable: name }));
    }, []);

    const removeTable = useCallback((name: string) => {
        setState(prev => {
            const newTables = { ...prev.tables };
            delete newTables[name];
            return {
                ...prev,
                tables: newTables,
                activeTable: prev.activeTable === name ? (Object.keys(newTables)[0] || null) : prev.activeTable
            };
        });
    }, []);

    const resetData = useCallback(() => {
        setState(prev => ({
            ...prev,
            activeTable: null,
            tables: {},
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

    const setRules = useCallback((tableName: string, rules: any[]) => {
        setState(prev => ({
            ...prev,
            rules: { ...prev.rules, [tableName]: rules }
        }));
    }, []);

    const getActiveBaseline = useCallback(() => {
        if (!state.activeTable) return null;
        return state.baselines[state.activeTable] || null;
    }, [state.activeTable, state.baselines]);

    if (!isLoaded) return null;

    return (
        <DataContext.Provider value={{
            ...state,
            addTable,
            setActiveTable,
            removeTable,
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
