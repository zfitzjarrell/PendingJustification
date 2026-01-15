// frontend/src/brain/index.ts

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

// For local dev, you can either run a backend on 8000, or set VITE_API_BASE_URL to your worker base.
const DEFAULT_LOCAL_API = "http://127.0.0.1:8000";

// IMPORTANT: must be VITE_ prefixed for browser builds (Netlify/Vite)
const ENV_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

// This should be: https://pendingjustification.com/proxy   (in Netlify env)
export const API_BASE_URL = stripTrailingSlash(ENV_BASE || DEFAULT_LOCAL_API);

// Build absolute URL safely (keeps /proxy if present in API_BASE_URL)
export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

async function request(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  const resp = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });

  // Helpful debugging when a proxy returns HTML instead of JSON
  const ct = resp.headers.get("content-type") || "";
  if (!resp.ok) {
    const text = await resp.clone().text().catch(() => "");
    throw new Error(
      `API ${resp.status} for ${url}\ncontent-type=${ct}\nbody=${text.slice(0, 300)}`
    );
  }

  return resp;
}

// --- Methods Dashboard expects ---
async function list_topics_jaas(init: RequestInit = {}) {
  return request("/routes/jaas/topics", { method: "GET", ...init });
}

async function list_tones_jaas(init: RequestInit = {}) {
  return request("/routes/jaas/tones", { method: "GET", ...init });
}

// This endpoint name is inferred from your Brain client usage.
// If your Databutton route differs, only change the path here.
async function get_justification(payload: Record<string, any>, init: RequestInit = {}) {
  return request("/routes/jaas/justification", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: JSON.stringify(payload),
    ...init,
  });
}

const brain = {
  list_topics_jaas,
  list_tones_jaas,
  get_justification,
};

export default brain;
