import React from 'react';
import { SupportedFormat } from '@/lib/format-detector';
import { cn } from '@/lib/utils';

interface FormatBadgeProps {
    format: SupportedFormat;
    className?: string;
}

const FORMAT_COLORS: Record<SupportedFormat, string> = {
    csv: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    tsv: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    parquet: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    excel: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    json: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    jsonl: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    sqlite: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    sql: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    xml: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    unknown: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export const FormatBadge: React.FC<FormatBadgeProps> = ({ format, className }) => {
    return (
        <span
            className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                FORMAT_COLORS[format] || FORMAT_COLORS.unknown,
                className
            )}
        >
            {format}
        </span>
    );
};
