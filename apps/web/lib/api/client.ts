export const API_BASE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    // If accessing from a remote domain and envUrl points to localhost or is missing, use relative /api/v1
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
        return "/api/v1";
      }
    }
  }
  return envUrl || "http://localhost:8000/api/v1";
})();

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ion_auth_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("ion_auth_token", token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ion_auth_token");
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = getAuthToken();

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (!(customConfig.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    let validationErrors: Record<string, string[]> | undefined;
    let errorCode: string | undefined;
    let errorDataPayload: any;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      validationErrors = errorData.errors;
      errorCode = errorData.code;
      errorDataPayload = errorData;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    if (response.status === 401 && typeof window !== "undefined") {
      removeAuthToken();
    }

    throw new ApiError(response.status, errorMessage, validationErrors, errorCode, errorDataPayload);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
