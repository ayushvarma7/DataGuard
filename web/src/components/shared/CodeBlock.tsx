"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
}

export function CodeBlock({
    code,
    language = "bash",
    showLineNumbers = false,
    className,
    ...props
}: CodeBlockProps) {
    const [copied, setCopied] = React.useState(false);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("relative group rounded-lg overflow-hidden border border-border bg-black/50 text-sm", className)} {...props}>
            <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-muted-foreground text-xs uppercase font-mono">{language}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={copyToClipboard}
                >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-foreground/90">
                    <code>
                        {showLineNumbers
                            ? code.split("\n").map((line, i) => (
                                <div key={i} className="table-row">
                                    <span className="table-cell text-muted-foreground/50 select-none pr-4 text-right">{i + 1}</span>
                                    <span className="table-cell">{line}</span>
                                </div>
                            ))
                            : code}
                    </code>
                </pre>
            </div>
        </div>
    );
}
