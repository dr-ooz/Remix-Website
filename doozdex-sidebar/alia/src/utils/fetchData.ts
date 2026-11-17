const NEW_API =
  "https://script.google.com/macros/s/AKfycbyz_3y1ZoYm7kxXmTBuFGCZJYmZ9YfNcMGns6-EyNLlQFXW6JiH7m23M8p826KBDuk/exec";

type APIResponse = { status: "success"; data: Data } | { status: "error"; message: string };

const TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 3;

let currentController: AbortController | null = null;

async function fetchJSON<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchData(datasetId: string): Promise<Data | null> {
  currentController?.abort();
  const controller = new AbortController();
  currentController = controller;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptController = new AbortController();
    const onOuterAbort = () => attemptController.abort();
    controller.signal.addEventListener("abort", onOuterAbort);
    const timer = setTimeout(() => attemptController.abort(), TIMEOUT_MS);

    try {
      const url = `${NEW_API}?gameId=${encodeURIComponent(datasetId)}`;
      const res = await fetchJSON<APIResponse>(url, attemptController.signal);
      return res.status === "error" ? null : res.data;
    } catch (err) {
      if (controller.signal.aborted) return null;
      if (attempt === MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", onOuterAbort);
    }
  }
  return null;
}
