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

  // Handle local development or production domain translation for localhost storage paths
  if (url.startsWith("http://localhost/storage")) {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      // On production, route storage through current domain origin
      return url.replace("http://localhost", window.location.origin);
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    if (apiUrl.includes(":8000")) {
      return url.replace("http://localhost/storage", "http://localhost:8000/storage");
    }
  }

  if (url.startsWith("/storage")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url}`;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const base = apiUrl.replace(/\/api\/.*$/, "");
    return `${base}${url}`;
  }

  return url;
}
