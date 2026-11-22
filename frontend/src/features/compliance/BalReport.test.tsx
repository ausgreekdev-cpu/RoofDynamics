import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BalReport } from "./BalReport";

describe("BalReport", () => {
  it("shows BAL-29 for Kalamunda", () => {
    render(<BalReport />);
    const input = screen.getByPlaceholderText("e.g. Kalamunda");
    fireEvent.change(input, { target: { value: "Kalamunda" } });
    expect(screen.getByText(/BAL rating: BAL-29/)).toBeInTheDocument();
  });

  it("shows not bushfire prone for Fremantle", () => {
    render(<BalReport />);
    const input = screen.getByPlaceholderText("e.g. Kalamunda");
    fireEvent.change(input, { target: { value: "Fremantle" } });
    expect(screen.getByText(/Not bushfire prone/)).toBeInTheDocument();
  });
});
