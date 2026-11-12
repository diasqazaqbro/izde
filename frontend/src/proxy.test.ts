import { describe, expect, it } from "vitest";
import { isAdminPath } from "./proxy";

describe("isAdminPath", () => {
  it.each(["/admin", "/admin/", "/admin/users", "/pricing", "/pricing/", "/%61dmin", "/%70ricing"])("%s is admin only", (p) => {
    expect(isAdminPath(p)).toBe(true);
  });
  it.each(["/", "/administration", "/search", "/chat/admin", "/pricing-info", "/%E0%A4%A"])("%s is not", (p) => {
    expect(isAdminPath(p)).toBe(false);
  });
});
