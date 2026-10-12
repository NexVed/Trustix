export const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 90_000;

export function startBackendKeepAlive(apiUrl: string): () => void {
  let url: URL;
  try {
    url = new URL(apiUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return () => {};
    url.pathname = `${url.pathname.replace(/\/$/, "")}/health`;
    url.search = ""; url.hash = "";
  } catch { return () => {}; }

  let stopped = false;
  let active: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let requestTimer: ReturnType<typeof setTimeout> | undefined;
  let lastAttempt = -Infinity;

  const ping = async (attempt = 0) => {
    if (stopped || active || !navigator.onLine) return;
    clearTimeout(retryTimer);
    const controller = new AbortController();
    active = controller; lastAttempt = Date.now();
    requestTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), {
        method: "GET", credentials: "omit", cache: "no-store", signal: controller.signal,
      });
      if (!response.ok) throw new Error("Backend health check failed.");
      const result = await response.json();
      if (result.status !== "ok" || result.service !== "trustix-api") throw new Error("Unexpected backend health response.");
    } catch {
      // Cold starts can outlast a request. Retry only this safe, public GET.
      if (!stopped && attempt < 2) retryTimer = setTimeout(() => { void ping(attempt + 1); }, 5000 * (attempt + 1));
    } finally {
      clearTimeout(requestTimer);
      if (active === controller) active = null;
    }
  };

  const wake = () => {
    if (Date.now() - lastAttempt >= 60_000) void ping();
  };
  const visibilityChanged = () => { if (document.visibilityState === "visible") wake(); };
  const interval = setInterval(() => { void ping(); }, KEEP_ALIVE_INTERVAL_MS);
  window.addEventListener("online", wake);
  document.addEventListener("visibilitychange", visibilityChanged);
  void ping();

  return () => {
    stopped = true;
    clearInterval(interval); clearTimeout(retryTimer); clearTimeout(requestTimer);
    active?.abort();
    window.removeEventListener("online", wake);
    document.removeEventListener("visibilitychange", visibilityChanged);
  };
}
