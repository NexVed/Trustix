import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createReportPdf } from "./workspace-pdf";

describe("PDF generation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates an actual multi-page PDF from long reports", async () => {
    const font = await readFile("public/fonts/NotoSans-Regular.ttf");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) })));
    const output = await createReportPdf({
      title: "Trustix test report", generatedAt: "2026-10-12T00:00:00Z",
      notice: "Synthetic test data only.",
      sections: [{ title: "Events", columns: ["Action", "Entity", "Count"], rows: Array.from({ length: 150 }, (_, index) => ["Document uploaded", `José Example ${index}`, index]) }],
    });
    const source = new TextDecoder("latin1").decode(output);
    expect(source.startsWith("%PDF-")).toBe(true);
    expect(source).toContain("%%EOF");
    expect((source.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(1);
  });
});
