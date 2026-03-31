import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "./http-client";

describe("createApiClient", () => {
  it("adds bearer token to authorized requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ role: "student" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = createApiClient({
      apiBaseUrl: "https://api.example.test",
      fetchFn: fetchMock,
      getToken: () => "token-123",
    });

    await client.get("/me", { authenticated: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });

  it("surfaces backend detail together with request id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Role not allowed" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": "req-42",
        },
      }),
    );

    const client = createApiClient({
      apiBaseUrl: "https://api.example.test",
      fetchFn: fetchMock,
    });

    await expect(client.get("/admin/metrics")).rejects.toMatchObject({
      status: 403,
      message: "Role not allowed (request: req-42)",
      requestId: "req-42",
    });
  });
});
