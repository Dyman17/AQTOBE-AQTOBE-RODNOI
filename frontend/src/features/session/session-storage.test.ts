import { describe, expect, it } from "vitest";
import { clearStoredSession, loadStoredSession, saveStoredSession } from "./session-storage";

describe("session storage", () => {
  it("returns null when no session is stored", () => {
    expect(loadStoredSession()).toBeNull();
  });

  it("persists and restores the session payload", () => {
    saveStoredSession({
      token: "abc",
      role: "admin",
      authMode: "quick",
    });

    expect(loadStoredSession()).toEqual({
      token: "abc",
      role: "admin",
      authMode: "quick",
    });
  });

  it("drops malformed payloads instead of throwing", () => {
    window.localStorage.setItem("aqbobek.session", "{bad json");

    expect(loadStoredSession()).toBeNull();
  });

  it("clears the persisted session", () => {
    saveStoredSession({
      token: "abc",
      role: "student",
      authMode: "credentials",
    });

    clearStoredSession();

    expect(loadStoredSession()).toBeNull();
  });
});
