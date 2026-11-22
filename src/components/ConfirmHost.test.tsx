import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ConfirmHost from "./ConfirmHost";
import { confirmAction } from "@/lib/confirm";

afterEach(cleanup);

describe("confirmAction", () => {
  it("resolves true when the person confirms", async () => {
    render(<ConfirmHost />);
    let answer!: Promise<boolean>;
    act(() => { answer = confirmAction("Delete this notice?"); });
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Yes, continue" }));
    await expect(answer).resolves.toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resolves false on Cancel and on Escape", async () => {
    render(<ConfirmHost />);
    let first!: Promise<boolean>;
    act(() => { first = confirmAction("Delete this notice?"); });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await expect(first).resolves.toBe(false);

    let second!: Promise<boolean>;
    act(() => { second = confirmAction("Delete that notice?"); });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await expect(second).resolves.toBe(false);
  });

  it("uses a neutral confirm label for publish-type actions", () => {
    render(<ConfirmHost />);
    act(() => { void confirmAction("Unlock and publish report cards?"); });
    expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();
  });
});
