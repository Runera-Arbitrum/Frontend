"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  tapFeedback?: boolean;
  variant?: "default" | "white";
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const variantStyles = {
  default: "bg-surface border-border-light/70",
  white: "bg-white border-border-light",
};

export default function Card({
  children,
  padding = "md",
  hoverable = false,
  tapFeedback = false,
  variant = "default",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        variantStyles[variant],
        "shadow-card",
        hoverable &&
          "hover:shadow-card-hover active:scale-[0.98] active:bg-surface-secondary transition-all duration-150 cursor-pointer ios-press",
        tapFeedback && "ios-list-item active:bg-primary/5 cursor-pointer",
        !hoverable && !tapFeedback && "transition-shadow duration-250",
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold text-text-primary tracking-tight",
        className,
      )}
    >
      {children}
    </h3>
  );
}
