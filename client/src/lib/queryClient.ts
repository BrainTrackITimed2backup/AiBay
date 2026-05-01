import { QueryClient, QueryFunction } from "@tanstack/react-query";

const CONFIGURED_API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const PAGES_FALLBACK_API_BASE = "https://aibay-3gql.onrender.com";

function getRuntimeApiBase(): string {
  if (CONFIGURED_API_BASE) return CONFIGURED_API_BASE;
  if (typeof window === "undefined") return "";

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith(".pages.dev") || hostname.endsWith(".workers.dev")) {
    return PAGES_FALLBACK_API_BASE;
  }

  return "";
}

export function buildApiUrl(url: string): string {
  if (!url.startsWith("/api/")) return url;
  const apiBase = getRuntimeApiBase();
  return apiBase ? `${apiBase}${url}` : url;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = buildApiUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "omit",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const fullUrl = buildApiUrl(path);
    const res = await fetch(fullUrl, {
      credentials: "omit",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
