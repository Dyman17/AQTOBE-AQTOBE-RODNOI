import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "./session-context";

const { getMeMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
}));

vi.mock("@/shared/api/aqbobek-service", () => ({
  aqbobekApi: {
    auth: {
      getMe: getMeMock,
      quickLogin: vi.fn(),
      login: vi.fn(),
      registerStudent: vi.fn(),
      registerParent: vi.fn(),
    },
  },
}));

function Probe() {
  const { session, error, isBootstrapping } = useSession();
  return (
    <div>
      <div data-testid="session">{session?.token || "none"}</div>
      <div data-testid="error">{error || "none"}</div>
      <div data-testid="loading">{String(isBootstrapping)}</div>
    </div>
  );
}

describe("SessionProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getMeMock.mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("clears stored session when bootstrap /me fails", async () => {
    window.localStorage.setItem(
      "aqbobek.session",
      JSON.stringify({
        token: "stale-token",
        role: "student",
        authMode: "credentials",
      }),
    );
    getMeMock.mockRejectedValue(new Error("Invalid or expired token"));

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session")).toHaveTextContent("none");
      expect(screen.getByTestId("error")).toHaveTextContent("Invalid or expired token");
    });

    expect(window.localStorage.getItem("aqbobek.session")).toBeNull();
  });
});
