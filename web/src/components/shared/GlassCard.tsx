import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "strong" | "subtle";
    gradientBorder?: boolean;
    hoverEffect?: boolean;
}

export function GlassCard({
    children,
    className,
    variant = "default",
    gradientBorder = false,
    hoverEffect = false,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl transition-all duration-300",
                // Glass variants
                variant === "default" && "glass",
                variant === "strong" && "glass-strong",
                variant === "subtle" && "glass-subtle",
                // Additional effects
                gradientBorder && "gradient-border",
                hoverEffect && "hover:bg-white/10 hover:shadow-lg hover:-translate-y-1",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
