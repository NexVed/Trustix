import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KEEP_ALIVE_INTERVAL_MS, startBackendKeepAlive } from "./backend-keep-alive";

describe("backend keep alive", () => {
  let stop: (() => void) | undefined;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ status: "ok", service: "trustix-api" }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  });
  afterEach(() => { stop?.(); stop = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("pings immediately and every five minutes without credentials", async () => {
    stop = startBackendKeepAlive("https://trustix.example/");
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledWith("https://trustix.example/health", expect.objectContaining({ method: "GET", credentials: "omit", cache: "no-store" }));
    await vi.advanceTimersByTimeAsync(KEEP_ALIVE_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries failures only twice before the next scheduled check", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    stop = startBackendKeepAlive("https://trustix.example");
    await vi.advanceTimersByTimeAsync(20_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("aborts in-flight work and removes all timers on cleanup", async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    stop = startBackendKeepAlive("https://trustix.example");
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    stop();
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    window.dispatchEvent(new Event("online"));
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(KEEP_ALIVE_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips offline checks and wakes when connectivity returns", async () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    stop = startBackendKeepAlive("https://trustix.example");
    expect(fetchMock).not.toHaveBeenCalled();
    online.mockReturnValue(true);
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("checks on returning to the tab without duplicate rapid calls", async () => {
    stop = startBackendKeepAlive("https://trustix.example");
    await vi.advanceTimersByTimeAsync(0);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(61_000);
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not crash the app on invalid URLs or leak URL credentials", () => {
    for (const url of ["not a URL", "https://user:password@trustix.example"]) {
      const cleanup = startBackendKeepAlive(url); cleanup();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
