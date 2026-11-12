import { describe, expect, it } from "vitest";
import { isEmail, parseSession, safeNext } from "./parse";

describe("safeNext (redirect after login)", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/search?q=fx&mode=keyword")).toBe("/search?q=fx&mode=keyword");
    expect(safeNext("/chat/abc#x")).toBe("/chat/abc#x");
    expect(safeNext("/%2F%2Fevil.com")).toBe("/%2F%2Fevil.com"); // encoded slashes stay a local path
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    null,
  ])("sends %j home", (next) => {
    expect(safeNext(next)).toBe("/");
  });
});

describe("parseSession", () => {
  it("accepts a valid session and rejects tampered ones", () => {
    expect(parseSession('{"email":"a@iitu.edu.kz","role":"student"}')).toEqual({ email: "a@iitu.edu.kz", role: "student" });
    expect(parseSession('{"email":"a@iitu.edu.kz","role":"root"}')).toBeNull();
    expect(parseSession('{"email":"<img src=x onerror=alert(1)>","role":"admin"}')).toBeNull();
    expect(parseSession("not json")).toBeNull();
    expect(parseSession('"string"')).toBeNull();
  });

  it("limits email length so the cookie stays under 4 KB", () => {
    expect(isEmail(`${"a".repeat(250)}@x.kz`)).toBe(false);
  });
});
