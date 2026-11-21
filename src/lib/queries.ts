"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// Re-export for convenience so views can import useQuery from a single module.
export { useQuery, useMutation, useQueryClient };

async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data as T;
}

export function useList<T = any>(view: string, enabled = true) {
  return useQuery({
    queryKey: ["list", view],
    queryFn: () => fetchJson<T>(`/api/data?view=${encodeURIComponent(view)}`),
    enabled,
  });
}

export function useDetail<T = any>(view: string, id: string | null | undefined) {
  return useQuery({
    queryKey: ["detail", view, id],
    queryFn: () =>
      fetchJson<T>(
        `/api/data?view=${encodeURIComponent(view)}&id=${encodeURIComponent(id || "")}`
      ),
    enabled: !!id,
  });
}

export function useDashboard<T = any>(view: string) {
  return useList<T>(view);
}

export function useNotifications<T = any>() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchJson<T>(`/api/data?view=notifications`),
    refetchInterval: 60_000,
  });
}

export function useAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      fetchJson<{ success?: boolean; [k: string]: any }>(`/api/data`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      // Invalidate broadly — single-page app, all data may be affected
      qc.invalidateQueries();
    },
  });
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () =>
      fetchJson<{ user: any }>(`/api/auth/me`),
    staleTime: 60_000,
  });
}
