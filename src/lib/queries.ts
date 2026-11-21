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
      // Invalidate broadly - single-page app, all data may be affected
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

// File upload helper. Pass a File and optional metadata. Returns the uploaded
// file record including its public URL.
export function useUploadFile() {
  return useMutation({
    mutationFn: async (input: {
      file: File;
      category?: string;
      refType?: string;
      refId?: string;
    }) => {
      const form = new FormData();
      form.append("file", input.file);
      if (input.category) form.append("category", input.category);
      if (input.refType) form.append("refType", input.refType);
      if (input.refId) form.append("refId", input.refId);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      return data as {
        id: string;
        filename: string;
        url: string;
        mimeType: string;
        size: number;
        category: string;
      };
    },
  });
}

// Reusable file input button that uploads on selection and calls back with the URL.
export function useFilePicker(
  onUploaded: (url: string, filename: string) => void,
  category = "attachment"
) {
  return {
    async onFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      onUploaded(data.url, data.filename);
      // Reset input so the same file can be re-selected later
      e.target.value = "";
    },
  };
}
