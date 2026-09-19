"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  perPage?: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  isLoading?: boolean;
  className?: string;
  theme?: "primary" | "purple";
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50],
  isLoading = false,
  className,
  theme = "primary",
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) {
    return null;
  }

  const from = perPage ? Math.min((currentPage - 1) * perPage + 1, totalItems || 0) : 1;
  const to = perPage ? Math.min(currentPage * perPage, totalItems || 0) : totalItems || 0;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  const activeColor =
    theme === "purple"
      ? "bg-purple-700 text-white border-purple-700 font-bold shadow-xs"
      : "bg-[#1E4ED8] text-white border-[#1E4ED8] font-bold shadow-xs";

  const hoverColor =
    theme === "purple"
      ? "hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
      : "hover:bg-blue-50 hover:text-[#1E4ED8] hover:border-blue-200";

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-3.5 bg-white border-t border-slate-200 text-xs text-slate-600 rounded-b-xl",
        className
      )}
    >
      {/* Information text & Per Page selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {totalItems !== undefined && totalItems > 0 ? (
          <span className="text-slate-500 font-medium">
            <span className="hidden sm:inline">Menampilkan </span>
            <span className="font-semibold text-slate-800">{from}</span> -{" "}
            <span className="font-semibold text-slate-800">{to}</span> dari{" "}
            <span className="font-semibold text-slate-800">{totalItems}</span> data
          </span>
        ) : (
          <span className="text-slate-500 font-medium">
            Halaman <span className="font-semibold text-slate-800">{currentPage}</span> dari{" "}
            <span className="font-semibold text-slate-800">{Math.max(totalPages, 1)}</span>
          </span>
        )}

        {onPerPageChange && perPage && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 hidden md:inline">Baris:</span>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              disabled={isLoading}
              className="text-xs font-semibold rounded-lg border border-slate-200 bg-white py-1 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4ED8] cursor-pointer"
            >
              {perPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / hal
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Navigation Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Halaman Pertama"
          title="Halaman Pertama"
          className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Halaman Sebelumnya"
          title="Halaman Sebelumnya"
          className="h-9 px-2.5 sm:h-8 sm:px-2.5 flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Page Number Buttons (Hidden on tiny screens, shown on sm+) */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-8 w-8 flex items-center justify-center text-slate-400 font-semibold select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-8 min-w-[32px] px-2 flex items-center justify-center rounded-lg border text-xs transition-all cursor-pointer",
                  isActive
                    ? activeColor
                    : cn("border-slate-200 text-slate-700 bg-white", hoverColor)
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Mobile-only compact page indicator */}
        <div className="sm:hidden px-2 text-xs font-semibold text-slate-700">
          {currentPage} / {Math.max(totalPages, 1)}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Halaman Selanjutnya"
          title="Halaman Selanjutnya"
          className="h-9 px-2.5 sm:h-8 sm:px-2.5 flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Halaman Terakhir"
          title="Halaman Terakhir"
          className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
