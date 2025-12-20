"use client";

import React, { useState } from "react";
import {
    Shield,
    LayoutDashboard,
    FileSearch,
    ShieldCheck,
    GitBranch,
    Settings,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Database,
    Layout,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataProvider, useData } from "@/context/DataContext";

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { title: "Schema View", href: "/dashboard/schema", icon: FileSearch },
    { title: "Drift", href: "/dashboard/drift", icon: Activity },
    { title: "Data Preview", href: "/dashboard/preview", icon: Layout },
    { title: "Validation", href: "/dashboard/validation", icon: ShieldCheck },
    { title: "Lineage", href: "/dashboard/lineage", icon: GitBranch },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { activeTable } = useData();
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#07070a] text-foreground overflow-hidden">
            {/* Sidebar Desktop */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r border-white/5 bg-[#0a0a0f] transition-all duration-300 relative",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        {!collapsed && (
                            <span className="font-bold tracking-tight text-lg animate-in fade-in slide-in-from-left-2">
                                DataGuard
                            </span>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "group-hover:text-foreground")} />
                                {!collapsed && (
                                    <span className="truncate animate-in fade-in slide-in-from-left-2">{item.title}</span>
                                )}
                                {isActive && collapsed && (
                                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
                        <Settings className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>Settings</span>}
                    </button>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
                    >
                        {collapsed ? <ChevronRight className="h-5 w-5 shrink-0" /> : <ChevronLeft className="h-5 w-5 shrink-0" />}
                        {!collapsed && <span>Collapse Sidebar</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-white/5 bg-[#0a0a0f]/50 backdrop-blur-xl flex items-center justify-between px-6 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="h-8 w-px bg-white/10 hidden md:block" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <Database className="h-3 w-3" />
                            <span className="font-mono">
                                {activeTable ? `Dataset: ${activeTable}` : "Engine: DuckDB-WASM"}
                            </span>
                            <div className={cn(
                                "h-1.5 w-1.5 rounded-full ml-1",
                                activeTable ? "bg-primary animate-pulse" : "bg-muted-foreground"
                            )} />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-medium">Ayush Varma</span>
                            <span className="text-[10px] text-muted-foreground">Pro Member</span>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                            <div className="h-full w-full rounded-full bg-[#0a0a0f] flex items-center justify-center text-xs font-bold">
                                AV
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto bg-[#07070a] p-6 lg:p-10 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-300">
                    <div className="w-64 h-full bg-[#0a0a0f] border-r border-white/10 p-6 space-y-8 animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-6 w-6 text-primary" />
                                <span className="font-bold text-xl">DataGuard</span>
                            </div>
                            <button onClick={() => setMobileOpen(false)}>
                                <X className="h-6 w-6 text-muted-foreground" />
                            </button>
                        </div>
                        <nav className="space-y-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg text-sm font-medium",
                                        pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <DataProvider>
            <DashboardShell>{children}</DashboardShell>
        </DataProvider>
    );
}
