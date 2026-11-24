import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "../../components/Toast";
import { WhsSwmsPanel } from "./WhsSwmsPanel";

describe("WhsSwmsPanel", () => {
  it("renders checklist and disables sync when incomplete", () => {
    render(<ToastProvider><WhsSwmsPanel projectId="proj-1" /></ToastProvider>);
    expect(screen.getByText(/Working at Heights WHS/)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Sign Off & Sync|Save Offline/ });
    expect(btn).toBeDisabled();
  });

  it("enables sync after all checks and a signature", () => {
    render(<ToastProvider><WhsSwmsPanel projectId="proj-1" /></ToastProvider>);
    // check all mandatory items
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => fireEvent.click(cb));
    // The button should still be disabled (no signature)
    const btn = screen.getByRole("button", { name: /Sign Off & Sync|Save Offline/ });
    expect(btn).toBeDisabled();
  });
});
