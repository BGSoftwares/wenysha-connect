import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRefreshToken, refreshAccessToken } from "@/lib/api";

const REFRESH_KEY = "ablegodcollege_refresh_token";
const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

describe("refreshAccessToken", () => {
  beforeEach(() => localStorage.setItem(REFRESH_KEY, "refresh-1"));
  afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); });

  it("shares one refresh call between requests that expire together", async () => {
    const fetchMock = vi.fn(() => json(200, { access: "access-2", refresh: "refresh-2" }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toEqual(["access-2", "access-2", "access-2"]);
    expect(getRefreshToken()).toBe("refresh-2");
  });

  it("can refresh again after the first refresh has finished", async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => json(200, { access: "a2", refresh: "refresh-2" }))
      .mockImplementationOnce(() => json(200, { access: "a3", refresh: "refresh-3" }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await refreshAccessToken()).toBe("a2");
    expect(await refreshAccessToken()).toBe("a3");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses a token another tab stored while the first attempt was failing", async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => {
        localStorage.setItem(REFRESH_KEY, "refresh-from-other-tab");
        return json(401, { detail: "Token is blacklisted" });
      })
      .mockImplementationOnce(() => json(200, { access: "a9", refresh: "refresh-9" }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await refreshAccessToken()).toBe("a9");
    expect(JSON.parse(String((fetchMock.mock.calls[1] as unknown[])[1] && ((fetchMock.mock.calls[1] as unknown[])[1] as { body: string }).body))).toEqual({ refresh: "refresh-from-other-tab" });
  });

  it("fails, and clears nothing, when the server rejects the token", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json(401, { detail: "Token is invalid" })));
    await expect(refreshAccessToken()).rejects.toThrow("Token is invalid");
  });
});
