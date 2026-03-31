import { describe, expect, it } from "vitest";
import { evaluateWorkspaceAccess } from "./route-guard";

describe("evaluateWorkspaceAccess", () => {
  it("redirects guests to login when route requires a role", () => {
    expect(evaluateWorkspaceAccess(null, "student")).toBe("redirect-login");
  });

  it("redirects authenticated users away from the wrong workspace", () => {
    expect(evaluateWorkspaceAccess("teacher", "admin")).toBe("redirect-forbidden");
  });

  it("allows matching role to enter the workspace", () => {
    expect(evaluateWorkspaceAccess("admin", "admin")).toBe("allow");
  });
});
