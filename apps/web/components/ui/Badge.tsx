import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "online" | "away" | "busy" | "offline" | "waiting" | "assigned" | "active" | "closed" | "default";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    online: "bg-emerald-50 text-emerald-700 border-emerald-200",
    away: "bg-amber-50 text-amber-700 border-amber-200",
    busy: "bg-red-50 text-red-700 border-red-200",
    offline: "bg-slate-100 text-slate-600 border-slate-200",
    waiting: "bg-amber-50 text-amber-800 border-amber-200",
    assigned: "bg-blue-50 text-blue-800 border-blue-200",
    active: "bg-emerald-50 text-emerald-800 border-emerald-200",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
