"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration (default 5s)
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: CheckCircle2,
        error: XCircle,
        warning: AlertTriangle,
        info: Info,
    };
    const Icon = icons[toast.type];

    const colors = {
        success: 'border-primary/50 bg-primary/10 text-primary',
        error: 'border-red-500/50 bg-red-500/10 text-red-500',
        warning: 'border-orange-500/50 bg-orange-500/10 text-orange-500',
        info: 'border-blue-500/50 bg-blue-500/10 text-blue-500',
    };

    return (
        <div
            className={cn(
                'animate-in slide-in-from-right fade-in duration-300',
                'p-4 rounded-xl border backdrop-blur-xl',
                'bg-[#0a0a0f]/90 shadow-2xl',
                colors[toast.type]
            )}
        >
            <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{toast.title}</p>
                    {toast.description && (
                        <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// Convenience hooks for common toast types
export function useSuccessToast() {
    const { addToast } = useToast();
    return useCallback((title: string, description?: string) => {
        addToast({ type: 'success', title, description });
    }, [addToast]);
}

export function useErrorToast() {
    const { addToast } = useToast();
    return useCallback((title: string, description?: string) => {
        addToast({ type: 'error', title, description });
    }, [addToast]);
}
