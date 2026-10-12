import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBlob, downloadCsv, downloadJson, serializeCsv } from "./workspace-export";

describe("workspace CSV exports", () => {
  it("preserves commas, quotes and line breaks inside cells", () => {
    expect(serializeCsv([["Name", "Notes"], ['Estate, "Family"', "First line\nSecond line"]]))
      .toBe('"Name","Notes"\r\n"Estate, ""Family""","First line\nSecond line"');
  });

  it("neutralizes formula-like user content", () => {
    expect(serializeCsv([["=1+1", " +SUM(A1)", "@example", "-command"]]))
      .toBe('"\'=1+1","\' +SUM(A1)","\'@example","\'-command"');
  });

  it("exports zero counts and empty values without losing cells", () => {
    expect(serializeCsv([["Assets", 0, ""]])).toBe('"Assets","0",""');
  });
});

describe("browser downloads", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  function setup() {
    vi.useFakeTimers();
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:synthetic-download");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    let wasAttached = false;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      wasAttached = this.isConnected;
    });
    return { createObjectURL, revokeObjectURL, anchor: () => click.mock.contexts.at(-1) as HTMLAnchorElement, attached: () => wasAttached };
  }

  it("downloads an attached link and delays object URL cleanup", () => {
    const state = setup();
    downloadBlob("report.pdf", new Blob(["%PDF-test"], { type: "application/pdf" }));
    expect(state.attached()).toBe(true);
    expect(state.anchor().download).toBe("report.pdf");
    expect(state.anchor().isConnected).toBe(false);
    expect(state.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(state.revokeObjectURL).toHaveBeenCalledWith("blob:synthetic-download");
  });

  it("sanitizes file names and preserves extensions on long names", () => {
    const state = setup();
    downloadBlob("../secret:key.pdf", new Blob(["sample"]));
    expect(state.anchor().download).toBe(".._secret_key.pdf");
    downloadBlob("x".repeat(230) + ".pdf", new Blob(["sample"]));
    expect(state.anchor().download.length).toBe(200);
    expect(state.anchor().download.endsWith(".pdf")).toBe(true);
  });

  it("does not start an empty download", () => {
    const state = setup();
    expect(() => downloadBlob("empty.pdf", new Blob())).toThrow("empty");
    expect(state.createObjectURL).not.toHaveBeenCalled();
  });

  it("exports the correct MIME types for CSV and JSON", () => {
    const state = setup();
    downloadCsv("report.csv", [["Assets", 0]]);
    expect(state.createObjectURL.mock.calls[0][0].type).toBe("text/csv;charset=utf-8");
    downloadJson("report.json", { assets: 0 });
    expect(state.createObjectURL.mock.calls[1][0].type).toBe("application/json;charset=utf-8");
  });
});
