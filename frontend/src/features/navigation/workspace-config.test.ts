import { describe, expect, it } from "vitest";
import { getWorkspaceForRole } from "./workspace-config";

describe("getWorkspaceForRole", () => {
  it("returns student modules focused on progress and support", () => {
    const workspace = getWorkspaceForRole("student");

    expect(workspace.homePath).toBe("/student");
    expect(workspace.sections.map((section) => section.key)).toEqual([
      "overview",
      "analytics",
      "timetable",
      "portfolio",
      "social",
      "leaderboard",
    ]);
  });

  it("keeps admin operations separate from teacher tools", () => {
    const teacher = getWorkspaceForRole("teacher");
    const admin = getWorkspaceForRole("admin");

    expect(teacher.sections.map((section) => section.key)).toEqual([
      "overview",
      "early-warning",
      "class-report",
      "timetable",
      "substitution-notifications",
    ]);
    expect(admin.sections.some((section) => section.key === "schedule-lab")).toBe(true);
    expect(teacher.sections.some((section) => section.key === "schedule-lab")).toBe(false);
  });
});
