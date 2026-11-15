import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ verifyMfa: vi.fn(), resendMfaCode: vi.fn() }));

vi.mock("@/lib/api", () => ({
  verifyMfa: apiMock.verifyMfa,
  resendMfaCode: apiMock.resendMfaCode,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Something went wrong."),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { MfaCodeForm } from "@/components/auth/MfaCodeForm";

const challenge = { mfa_required: true, mfa_token: "t1", mfa_method: "totp", masked_destination: null, expires_in: 300 } as never;

const setup = () => {
  const onVerified = vi.fn();
  const onCancel = vi.fn();
  render(<MfaCodeForm challenge={challenge} onVerified={onVerified} onCancel={onCancel} />);
  return { onVerified, onCancel };
};
const submitButton = () => screen.getByRole("button", { name: "Verify and sign in" }) as HTMLButtonElement;
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("MfaCodeForm", () => {
  afterEach(cleanup);

  it("keeps Verify disabled until a full 6-digit code is typed", () => {
    setup();
    expect(submitButton().disabled).toBe(true);
    type("Verification code", "12345");
    expect(submitButton().disabled).toBe(true);
    type("Verification code", "123456");
    expect(submitButton().disabled).toBe(false);
  });

  it("signs the user in when the code is accepted", async () => {
    const { onVerified } = setup();
    const session = { access: "a", refresh: "r" };
    apiMock.verifyMfa.mockResolvedValue(session);
    type("Verification code", "123456");
    fireEvent.click(submitButton());
    await waitFor(() => expect(onVerified).toHaveBeenCalledWith(session));
    expect(apiMock.verifyMfa).toHaveBeenCalledWith("t1", "123456");
  });

  it("clears the code and stays on the form when the code is wrong", async () => {
    const { onVerified } = setup();
    apiMock.verifyMfa.mockRejectedValue(new Error("Invalid code"));
    type("Verification code", "000000");
    fireEvent.click(submitButton());
    await waitFor(() => expect((screen.getByLabelText("Verification code") as HTMLInputElement).value).toBe(""));
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("switches to backup codes, which need 10 characters", () => {
    setup();
    fireEvent.click(screen.getByText("Use a backup code"));
    expect(screen.getByLabelText("Backup code")).toBeTruthy();
    type("Backup code", "abcde-1234");
    expect(submitButton().disabled).toBe(true);
    type("Backup code", "abcde-12345");
    expect(submitButton().disabled).toBe(false);
  });

  it("lets the user go back to sign-in", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByText("Back to sign in"));
    expect(onCancel).toHaveBeenCalled();
  });
});
