import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return "";
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}



export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function getAttachmentUrl(url?: string | null): string {
  if (!url) return "#";

  // Handle local development port mismatch if url is missing :8000
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (apiUrl.includes(":8000") && url.startsWith("http://localhost/storage")) {
    return url.replace("http://localhost/storage", "http://localhost:8000/storage");
  }

  if (url.startsWith("/storage")) {
    const base = apiUrl ? apiUrl.replace(/\/api\/.*$/, "") : "http://localhost:8000";
    return `${base}${url}`;
  }

  return url;
}
