"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

interface RatingStarsProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({ value, onChange, readonly = false, size = "md" }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const activeRating = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => !readonly && setHoverValue(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= activeRating;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            className={cn(
              "transition-transform focus:outline-none",
              !readonly && "hover:scale-110 cursor-pointer active:scale-95"
            )}
            aria-label={`${star} star`}
          >
            <Star
              className={cn(
                starSizes[size],
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
