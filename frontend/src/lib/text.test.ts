import { describe, expect, it } from "vitest";
import { checkUpload, highlightParts, safeExternalUrl } from "./text";

describe("highlightParts", () => {
  it("marks matches case-insensitively at odd indexes", () => {
    expect(highlightParts("Retake the final exam", ["retake"])).toEqual(["", "Retake", " the final exam"]);
  });

  it("treats regex special characters as plain text", () => {
    for (const w of [".*", "(", "[a-z]+", "\\", "$^", "a|b", "<script>alert(1)</script>"])
      expect(() => highlightParts("some (text) [here] .* a|b", [w])).not.toThrow();
    expect(highlightParts("cost: $5 (min)", ["$5 (min)"])).toEqual(["cost: ", "$5 (min)", ""]);
  });

  it("stays fast on a huge repeated query", () => {
    const words = Array.from({ length: 100_000 }, (_, i) => `word${i % 997}`);
    const start = performance.now();
    highlightParts("x ".repeat(5_000), words);
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe("safeExternalUrl", () => {
  it("keeps http(s) links", () => {
    expect(safeExternalUrl("https://iitu.edu.kz/documents/1.pdf")).toBe("https://iitu.edu.kz/documents/1.pdf");
  });
  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "file:///etc/passwd", "/relative", "not a url"])(
    "drops %s",
    (url) => expect(safeExternalUrl(url)).toBeUndefined(),
  );
});

describe("checkUpload", () => {
  const pdf = { name: "Положение.PDF", type: "application/pdf", size: 1000 };
  it("accepts PDF and DOCX", () => {
    expect(checkUpload(pdf)).toBe("ok");
    expect(checkUpload({ name: "a.docx", type: "", size: 10 })).toBe("ok");
  });
  it("rejects other types, renamed files and wrong sizes", () => {
    expect(checkUpload({ name: "a.png", type: "image/png", size: 10 })).toBe("type");
    expect(checkUpload({ name: "virus.pdf", type: "application/x-msdownload", size: 10 })).toBe("type");
    expect(checkUpload({ name: "a.pdf.exe", type: "", size: 10 })).toBe("type");
    expect(checkUpload({ ...pdf, size: 0 })).toBe("size");
    expect(checkUpload({ ...pdf, size: 21 * 1024 * 1024 })).toBe("size");
  });
});
