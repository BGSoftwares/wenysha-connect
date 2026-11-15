import { describe, expect, it } from "vitest";
import { dashboardPathForRole, normalizePortalRole } from "@/lib/portalRoles";

describe("normalizePortalRole", () => {
  it.each([
    ["Admin", "admin"],
    ["School Administrator", "admin"],
    ["Class Teacher", "teacher"],
    ["class_teacher", "teacher"],
    ["Accounts", "accounts"],
    ["finance-officer", "accounts"],
    ["Learner", "student"],
    ["Guardian", "parent"],
  ])("maps %s to %s", (label, expected) => {
    expect(normalizePortalRole(label)).toBe(expected);
  });

  it("returns null for unknown, empty or missing roles", () => {
    expect(normalizePortalRole("Visitor")).toBeNull();
    expect(normalizePortalRole("   ")).toBeNull();
    expect(normalizePortalRole(undefined)).toBeNull();
    expect(normalizePortalRole(null)).toBeNull();
  });
});

describe("dashboardPathForRole", () => {
  it("sends each role to its own portal", () => {
    expect(dashboardPathForRole("Admin")).toBe("/admin");
    expect(dashboardPathForRole("Teacher")).toBe("/teacher");
    expect(dashboardPathForRole("Student")).toBe("/student");
    expect(dashboardPathForRole("Parent")).toBe("/parent");
    expect(dashboardPathForRole("Accounts")).toBe("/accounts");
  });

  it("has no portal for an unknown role", () => {
    expect(dashboardPathForRole("Visitor")).toBeNull();
  });
});
