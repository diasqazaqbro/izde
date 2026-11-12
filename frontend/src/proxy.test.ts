import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { csp, isAdminPath } from "./proxy";

describe("isAdminPath", () => {
  it.each(["/admin", "/admin/", "/admin/users", "/pricing", "/pricing/", "/%61dmin", "/%70ricing"])("%s is admin only", (p) => {
    expect(isAdminPath(p)).toBe(true);
  });
  it.each(["/", "/administration", "/search", "/chat/admin", "/pricing-info", "/%E0%A4%A"])("%s is not", (p) => {
    expect(isAdminPath(p)).toBe(false);
  });
});

describe("security headers", () => {
  it("CSP allows scripts only by nonce and forbids framing by other sites and plugins", () => {
    const policy = csp("abc");
    expect(policy).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    for (const d of ["frame-ancestors 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) expect(policy).toContain(d);
  });

  it("next.config sends nosniff, referrer and frame headers on every path", async () => {
    const [rule] = await nextConfig.headers!();
    const headers = Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));
    expect(rule.source).toBe("/:path*");
    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
    });
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
