"use client";

import React, { useState, useCallback } from "react";
import { useData } from "@/context/DataContext";
import { GlassCard } from "@/components/shared/GlassCard";
import { duckdbService } from "@/lib/duckdb";
import {
    ShieldCheck,
    Plus,
    Play,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

interface ValidationRule {
    id: string;
    type: "not_null" | "unique" | "positive";
    column: string;
}

interface ValidationResult {
    ruleId: string;
    passed: boolean;
    failureCount: number;
    running: boolean;
}

export default function ValidationPage() {
    const { activeTable, schema } = useData();
    const [rules, setRules] = useState<ValidationRule[]>([]);
    const [results, setResults] = useState<Record<string, ValidationResult>>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newRule, setNewRule] = useState<Partial<ValidationRule>>({ type: "not_null" });

    const addRule = () => {
        if (!newRule.column || !newRule.type) return;
        const rule: ValidationRule = {
            id: Math.random().toString(36).substr(2, 9),
            type: newRule.type as any,
            column: newRule.column,
        };
        setRules([...rules, rule]);
        setIsDialogOpen(false);
    };

    const removeRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
        const newResults = { ...results };
        delete newResults[id];
        setResults(newResults);
    };

    const runRule = async (rule: ValidationRule) => {
        if (!activeTable) return;

        setResults(prev => ({
            ...prev,
            [rule.id]: { ruleId: rule.id, passed: false, failureCount: 0, running: true }
        }));

        try {
            let query = "";
            switch (rule.type) {
                case "not_null":
                    query = `SELECT COUNT(*) as count FROM "${activeTable}" WHERE "${rule.column}" IS NULL`;
                    break;
                case "unique":
                    query = `SELECT COUNT(*) as count FROM (SELECT "${rule.column}", COUNT(*) as c FROM "${activeTable}" GROUP BY "${rule.column}" HAVING c > 1)`;
                    break;
                case "positive":
                    query = `SELECT COUNT(*) as count FROM "${activeTable}" WHERE "${rule.column}" <= 0`;
                    break;
            }

            const res = await duckdbService.query(query);
            const count = Number(res[0].count);

            setResults(prev => ({
                ...prev,
                [rule.id]: { ruleId: rule.id, passed: count === 0, failureCount: count, running: false }
            }));
        } catch (err) {
            console.error("Rule execution failed:", err);
            setResults(prev => ({
                ...prev,
                [rule.id]: { ruleId: rule.id, passed: false, failureCount: -1, running: false }
            }));
        }
    };

    const runAll = async () => {
        for (const rule of rules) {
            await runRule(rule);
        }
    };

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Database className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">No Active Dataset</h2>
                <p className="text-muted-foreground max-w-sm">
                    Please upload a dataset to define and run quality validation rules.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Validation Panel</h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                        {rules.length} Rules defined for {activeTable}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={runAll}
                        disabled={rules.length === 0}
                        className="border-primary/20 hover:bg-primary/5 text-primary"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Run All Checks
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Rule
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0a0f] border-white/10">
                            <DialogHeader>
                                <DialogTitle>Define Validation Rule</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Column</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
                                        value={newRule.column || ""}
                                        onChange={(e) => setNewRule({ ...newRule, column: e.target.value })}
                                    >
                                        <option value="" disabled>Choose a column...</option>
                                        {schema?.map(col => (
                                            <option key={col.column_name} value={col.column_name}>{col.column_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rule Type</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
                                        value={newRule.type || "not_null"}
                                        onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                                    >
                                        <option value="not_null">NOT NULL (Ensures no missing values)</option>
                                        <option value="unique">UNIQUE (Ensures no duplicates)</option>
                                        <option value="positive">POSITIVE (Ensures numbers &gt; 0)</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={addRule}>Save Rule</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {rules.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                        <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No validation rules defined yet. Click "Add Rule" to get started.</p>
                    </div>
                ) : rules.map((rule) => {
                    const result = results[rule.id];
                    return (
                        <GlassCard key={rule.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6" variant="subtle">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-3 rounded-xl bg-white/5 border border-white/10",
                                    result?.passed === true && "border-primary/50 text-primary",
                                    result?.passed === false && !result?.running && "border-red-500/50 text-red-500"
                                )}>
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground capitalize">{rule.type.replace("_", " ")}</span>
                                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-white/5">{rule.column}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {rule.type === "not_null" ? `Check for null values in column ${rule.column}` :
                                            rule.type === "unique" ? `Verify all values in ${rule.column} are unique` :
                                                `Ensure values in ${rule.column} are strictly greater than zero`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {result && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                        {result.running ? (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                Running...
                                            </div>
                                        ) : result.passed ? (
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 text-primary">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-sm font-bold">Passed</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">0 failures found</span>
                                            </div>
                                        ) : result.failureCount === -1 ? (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-sm font-bold">Error</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 text-red-500">
                                                    <XCircle className="h-4 w-4" />
                                                    <span className="text-sm font-bold">Failed</span>
                                                </div>
                                                <span className="text-[10px] text-red-500/80 font-mono font-bold">{result.failureCount.toLocaleString()} issues found</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => runRule(rule)}
                                        disabled={result?.running}
                                        className="hover:bg-primary/10 hover:text-primary"
                                    >
                                        <Play className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => removeRule(rule.id)}
                                        className="hover:bg-red-500/10 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
