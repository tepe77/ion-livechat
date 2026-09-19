import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap select-none";

    const variants = {
      primary: "bg-[#1E4ED8] hover:bg-[#1D40B0] active:bg-[#153396] text-white focus:ring-[#1E4ED8]",
      secondary: "bg-[#0F2B5B] hover:bg-[#0A1E40] active:bg-[#07152D] text-white focus:ring-[#0F2B5B]",
      accent: "bg-[#FF6B00] hover:bg-[#E55F00] active:bg-[#CC5400] text-white focus:ring-[#FF6B00]",
      outline: "border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-300",
      danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      ghost: "hover:bg-slate-100 text-slate-700 focus:ring-slate-200",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
