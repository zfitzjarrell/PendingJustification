// frontend/src/brain/index.ts

// Normalizes base URLs so you don't get double slashes like: https://x.com//routes/...
function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

// Prefer Vite env var (Netlify + local dev), fall back to local API for dev.
const DEFAULT_LOCAL_API = "http://127.0.0.1:8000";

// IMPORTANT: This must be VITE_ prefixed to be available in the browser build.
const ENV_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = stripTrailingSlash(ENV_BASE || DEFAULT_LOCAL_API);

// Keep this if the rest of your app expects it (e.g. `${API_BASE_URL}${API_PATH}/routes/...`)
export const API_PATH = "";

// Helper to build full URLs safely
export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

const brain = {
  API_BASE_URL,
  API_PATH,
  apiUrl,
};

export default brain;
