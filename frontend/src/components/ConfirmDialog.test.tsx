import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmDialogProvider, useConfirm } from "./ConfirmDialog";
import React from "react";

function Tester() {
  const confirm = useConfirm();
  const [result, setResult] = React.useState<string>("pending");
  return (
    <div>
      <button onClick={async () => setResult((await confirm({ title: "Delete?", description: "Sure?" })) ? "yes" : "no")}>
        ask
      </button>
      <span data-testid="result">{result}</span>
    </div>
  );
}

describe("ConfirmDialog", () => {
  it("resolves true on confirm", async () => {
    render(
      <ConfirmDialogProvider>
        <Tester />
      </ConfirmDialogProvider>
    );
    fireEvent.click(screen.getByText("ask"));
    await waitFor(() => expect(screen.getByText("Delete?")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Confirm"));
    await waitFor(() => expect(screen.getByTestId("result").textContent).toBe("yes"));
  });

  it("resolves false on cancel", async () => {
    render(
      <ConfirmDialogProvider>
        <Tester />
      </ConfirmDialogProvider>
    );
    fireEvent.click(screen.getByText("ask"));
    await waitFor(() => expect(screen.getByText("Delete?")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.getByTestId("result").textContent).toBe("no"));
  });
});
