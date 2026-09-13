import { apiClient, removeAuthToken, setAuthToken } from "./client";
import type { ApiResponse, User } from "@ion/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res.data?.token) {
    setAuthToken(res.data.token);
  }
  return res;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res.data?.token) {
    setAuthToken(res.data.token);
  }
  return res;
}

export async function getMe(): Promise<User> {
  const res = await apiClient<ApiResponse<User>>("/auth/me");
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient("/auth/logout", { method: "POST" });
  } finally {
    removeAuthToken();
  }
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  customer_number?: string;
  avatar?: string | null;
  password?: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const res = await apiClient<ApiResponse<User>>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}
