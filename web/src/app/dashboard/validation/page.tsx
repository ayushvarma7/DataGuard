"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
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
    Database,
    Sparkles,
    ArrowRight,
    Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
    const { activeTable, schema, rowCount, rules, setRules } = useData();
    const [results, setResults] = useState<Record<string, ValidationResult>>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newRule, setNewRule] = useState<Partial<ValidationRule>>({ type: "not_null" });
    const [stats, setStats] = useState<any[]>([]);

    // Fetch stats for suggestions
    useEffect(() => {
        async function fetchStats() {
            if (!activeTable || !schema) return;
            try {
                const nullQueries = schema.map(col => `sum(case when "${col.column_name}" is null then 1 else 0 end) as "${col.column_name}_nulls"`).join(", ");
                const distinctQueries = schema.map(col => `count(distinct "${col.column_name}") as "${col.column_name}_distinct"`).join(", ");
                const sql = `SELECT ${nullQueries}, ${distinctQueries} FROM "${activeTable}"`;
                const res = await duckdbService.query(sql);
                setStats(schema.map(col => ({
                    name: col.column_name,
                    nullCount: Number(res[0][`${col.column_name}_nulls`]),
                    distinctCount: Number(res[0][`${col.column_name}_distinct`])
                })));
            } catch (err) {
                console.error("Suggestion stats failed:", err);
            }
        }
        fetchStats();
    }, [activeTable, schema]);

    const suggestions = useMemo(() => {
        if (!activeTable || stats.length === 0) return [];
        const sugs: ValidationRule[] = [];
        stats.forEach(s => {
            // Suggest Not Null if 0 nulls
            if (s.nullCount === 0 && !rules.find(r => r.column === s.name && r.type === "not_null")) {
                sugs.push({ id: `sug-${s.name}-nn`, type: "not_null", column: s.name });
            }
            // Suggest Unique if 100% distinct
            if (s.distinctCount === rowCount && rowCount > 0 && !rules.find(r => r.column === s.name && r.type === "unique")) {
                sugs.push({ id: `sug-${s.name}-u`, type: "unique", column: s.name });
            }
        });
        return sugs.slice(0, 5); // Max 5 suggestions
    }, [activeTable, stats, rowCount, rules]);

    const addRule = (ruleOverride?: ValidationRule) => {
        const ruleToAdd = ruleOverride || {
            id: Math.random().toString(36).substr(2, 9),
            type: newRule.type as any,
            column: newRule.column!,
        };

        if (!ruleToAdd.column || !ruleToAdd.type) return;
        setRules([...rules, ruleToAdd]);
        setIsDialogOpen(false);
        setNewRule({ type: "not_null" });
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

    const exportToYAML = () => {
        if (!activeTable) return;
        const yaml = `dataset: ${activeTable}\nchecks:\n` +
            rules.map(r => `  - column: "${r.column}"\n    type: ${r.type}`).join("\n");

        const blob = new Blob([yaml], { type: "text/yaml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeTable}_contract.yaml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!activeTable) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Database className="h-12 w-12 text-primary/40" />
                </div>
                <h2 className="text-2xl font-bold">No Active Dataset</h2>
                <p className="text-muted-foreground max-sm mx-auto">
                    Please upload a dataset to define and run quality validation rules.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto pb-10">
            <div className="lg:col-span-3 space-y-8">
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
                            Run All
                        </Button>
                        {rules.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={exportToYAML}
                                className="text-muted-foreground hover:text-primary transition-colors h-8"
                            >
                                <Code2 className="mr-2 h-4 w-4" />
                                Export YAML
                            </Button>
                        )}
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
                                    <Button onClick={() => addRule()}>Save Rule</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {rules.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                            <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No validation rules defined yet.</p>
                        </div>
                    ) : rules.map((rule) => {
                        const result = results[rule.id];
                        return (
                            <GlassCard key={rule.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-6" variant="subtle">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl bg-white/5 border border-white/10",
                                        result?.passed === true && "border-primary/50 text-primary",
                                        result?.passed === false && !result?.running && "border-red-500/50 text-red-500"
                                    )}>
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-foreground capitalize">{rule.type.replace("_", " ")}</span>
                                            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-white/5">{rule.column}</Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {rule.type === "not_null" ? `Check for null values in ${rule.column}` :
                                                rule.type === "unique" ? `Verify all values in ${rule.column} are unique` :
                                                    `Ensure values in ${rule.column} are strictly > 0`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {result && (
                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                            {result.running ? (
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                    Running...
                                                </div>
                                            ) : result.passed ? (
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-primary">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-bold">Passed</span>
                                                    </div>
                                                    <span className="text-[8px] text-muted-foreground uppercase font-bold">Valid</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-red-500">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-bold">Failed</span>
                                                    </div>
                                                    <span className="text-[8px] text-red-500/80 font-mono font-bold tracking-tighter">
                                                        {result.failureCount.toLocaleString()} issues
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1">
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

            {/* Sidebar - Smart Suggestions */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <div className="bg-primary/20 p-1.5 rounded-lg">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm tracking-tight inline-flex items-center gap-2">
                        Smart Suggestions
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                    </h3>
                </div>

                <div className="space-y-3">
                    {suggestions.length === 0 ? (
                        <GlassCard className="p-4 border-white/5 opacity-50 text-center" variant="subtle">
                            <p className="text-[10px] text-muted-foreground italic">No suggestions available yet. Explore your data to unlock insights.</p>
                        </GlassCard>
                    ) : suggestions.map((sug) => (
                        <GlassCard
                            key={sug.id}
                            className="p-4 border-white/5 group hover:border-primary/40 transition-all duration-300 cursor-pointer"
                            variant="subtle"
                            onClick={() => addRule(sug)}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 bg-white/5 border-white/10">{sug.column}</Badge>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground capitalize">{sug.type.replace("_", " ")}</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1">Data profiling suggests this constraint holds true.</p>
                                </div>
                                <Button size="sm" className="h-7 text-[10px] w-full bg-white/5 hover:bg-primary/20 hover:text-primary border-white/10 font-bold">
                                    Apply Rule
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Notice</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Suggestions are based on structural analysis of your local dataset. They help jumpstart your data contract but should be reviewed by a domain expert.
                    </p>
                </div>
            </div>
        </div>
    );
}
