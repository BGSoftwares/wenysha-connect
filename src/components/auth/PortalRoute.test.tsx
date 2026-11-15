import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  getToken: vi.fn(),
  clearAuth: vi.fn(),
  getStoredUser: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: { get: apiMock.get },
  getToken: apiMock.getToken,
  clearAuth: apiMock.clearAuth,
  getStoredUser: apiMock.getStoredUser,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Something went wrong."),
}));
vi.mock("@/components/auth/FirstLoginPasswordChange", () => ({
  FirstLoginPasswordChange: () => <div>Choose a new password</div>,
}));
vi.mock("@/components/auth/MfaSetupGate", () => ({
  MfaSetupGate: () => <div>Set up two-step verification</div>,
}));

import { PortalRoute } from "@/components/auth/PortalRoute";

const renderAt = (path: string, role: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth" element={<div>Sign in page</div>} />
        <Route path="/teacher" element={<div>Teacher portal</div>} />
        <Route path={`/${role}`} element={<PortalRoute role={role}><div>{role} portal</div></PortalRoute>} />
      </Routes>
    </MemoryRouter>,
  );

describe("PortalRoute", () => {
  beforeEach(() => {
    apiMock.getToken.mockReturnValue("token");
    apiMock.getStoredUser.mockReturnValue(null);
  });
  afterEach(cleanup);

  it("sends visitors without a token to the sign-in page without calling the API", async () => {
    apiMock.getToken.mockReturnValue(null);
    renderAt("/admin", "admin");
    expect(await screen.findByText("Sign in page")).toBeTruthy();
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  it("shows the portal to a user whose role matches", async () => {
    apiMock.get.mockResolvedValue({ role: "Admin" });
    renderAt("/admin", "admin");
    expect(await screen.findByText("admin portal")).toBeTruthy();
  });

  it("redirects a teacher who opens the admin portal to the teacher portal", async () => {
    apiMock.get.mockResolvedValue({ role: "Class Teacher" });
    renderAt("/admin", "admin");
    expect(await screen.findByText("Teacher portal")).toBeTruthy();
    expect(screen.queryByText("admin portal")).toBeNull();
  });

  it("makes a first-time user choose a new password before entering", async () => {
    apiMock.get.mockResolvedValue({ role: "Admin", must_change_password: true });
    renderAt("/admin", "admin");
    expect(await screen.findByText("Choose a new password")).toBeTruthy();
    expect(screen.queryByText("admin portal")).toBeNull();
  });

  it("asks for two-step setup when the role requires it", async () => {
    apiMock.get.mockResolvedValue({ role: "Admin", mfa_setup_required: true });
    renderAt("/admin", "admin");
    expect(await screen.findByText("Set up two-step verification")).toBeTruthy();
  });

  it("clears the session and returns to sign-in when the token is rejected", async () => {
    apiMock.get.mockRejectedValue({ detail: "Given token not valid for any token type" });
    renderAt("/admin", "admin");
    expect(await screen.findByText("Sign in page")).toBeTruthy();
    await waitFor(() => expect(apiMock.clearAuth).toHaveBeenCalled());
  });

  it("offers a retry when the server cannot be reached", async () => {
    apiMock.get.mockRejectedValueOnce(new Error("Network down")).mockResolvedValueOnce({ role: "Admin" });
    renderAt("/admin", "admin");
    const retry = await screen.findByText("Try again");
    retry.click();
    expect(await screen.findByText("admin portal")).toBeTruthy();
  });
});
