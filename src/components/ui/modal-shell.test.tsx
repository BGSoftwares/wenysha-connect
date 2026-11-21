import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ModalShell from "./modal-shell";

afterEach(cleanup);

const open = (onClose = vi.fn()) => {
  render(
    <>
      <button>Opener</button>
      <ModalShell onClose={onClose} overlayClassName="overlay" className="panel">
        <h3>Add a student</h3>
        <input aria-label="Name" />
        <button>Save</button>
      </ModalShell>
    </>,
  );
  return onClose;
};

describe("ModalShell", () => {
  it("is announced as a dialog named by its heading and takes focus", () => {
    open();
    const dialog = screen.getByRole("dialog", { name: "Add a student" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(dialog);
  });

  it("closes on Escape and on a backdrop click, but not on a click inside", () => {
    const onClose = open();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByLabelText("Name"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("keeps Tab inside the dialog", () => {
    open();
    const save = screen.getByRole("button", { name: "Save" });
    save.focus();
    fireEvent.keyDown(save, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByLabelText("Name"));
    fireEvent.keyDown(screen.getByLabelText("Name"), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(save);
  });

  it("gives focus back to what opened it", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<ModalShell onClose={() => undefined}><h3>Title</h3></ModalShell>);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
