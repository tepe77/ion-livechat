import React from "react";
import { cn } from "../../lib/utils";

export interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: React.ReactNode;
  className?: string;
  textClassName?: string;
  textColor?: "dark" | "white";
}

export function BrandLogo({
  size = "md",
  showText = true,
  subtitle,
  className,
  textClassName,
  textColor = "dark",
}: BrandLogoProps) {
  const iconSizeClass = {
    xs: "h-7 w-7 rounded-lg p-1.5",
    sm: "h-8 w-8 rounded-lg p-1.5",
    md: "h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-2",
    lg: "h-12 w-12 rounded-2xl p-2.5",
    xl: "h-14 w-14 rounded-2xl p-3",
  }[size];

  const titleSizeClass = {
    xs: "text-xs font-bold",
    sm: "text-sm font-bold",
    md: "text-sm sm:text-base font-bold",
    lg: "text-xl font-extrabold",
    xl: "text-2xl font-extrabold",
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "bg-gradient-to-tr from-[#0F2B5B] to-[#1E4ED8] text-white flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden",
          iconSizeClass
        )}
      >
        <img
          src="/ion-white-logo.webp"
          alt="ION Broadband Logo"
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <div className={cn("min-w-0 text-left", textClassName)}>
          <div
            className={cn(
              "leading-tight tracking-tight truncate",
              titleSizeClass,
              textColor === "white" ? "text-white" : "text-slate-900"
            )}
          >
            ION Broadband Livechat
          </div>
          {subtitle && (
            <div
              className={cn(
                "text-[11px] leading-tight truncate mt-0.5",
                textColor === "white" ? "text-blue-100/80" : "text-slate-500"
              )}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
