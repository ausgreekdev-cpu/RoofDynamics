import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TutorialProvider, useTutorial, TUTORIAL_STEPS } from "./TutorialContext";
import { Tutorial } from "../components/Tutorial";

// Controllable auth state so we can test the login -> auto-start transition.
const { mockAuth } = vi.hoisted(() => ({ mockAuth: { isAuthenticated: false } }));
vi.mock("./AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: mockAuth.isAuthenticated }),
}));

// The global test setup provides a no-op localStorage mock; give it a real
// in-memory implementation so persistence behaviour can be verified.
const store = new Map<string, string>();
function installLocalStorage() {
  vi.mocked(localStorage.getItem).mockImplementation((k) => store.get(k) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((k, v) => {
    store.set(k, String(v));
  });
  vi.mocked(localStorage.removeItem).mockImplementation((k) => {
    store.delete(k);
  });
  vi.mocked(localStorage.clear).mockImplementation(() => store.clear());
}

/** Exposes the tutorial state machine for direct testing. */
function Harness() {
  const t = useTutorial();
  return (
    <div>
      <span data-testid="active">{String(t.isActive)}</span>
      <span data-testid="index">{t.stepIndex}</span>
      <span data-testid="title">{t.step?.title ?? ""}</span>
      <span data-testid="completed">{String(t.hasCompleted)}</span>
      <button onClick={t.start}>start</button>
      <button onClick={t.next}>next</button>
      <button onClick={t.back}>back</button>
      <button onClick={t.skip}>skip</button>
      <button onClick={t.finish}>finish</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <TutorialProvider>
      <Harness />
    </TutorialProvider>
  );
}

describe("TutorialContext", () => {
  beforeEach(() => {
    store.clear();
    sessionStorage.clear();
    installLocalStorage();
    mockAuth.isAuthenticated = false;
  });

  it("defines 8 guided steps with unique routes and targets", () => {
    expect(TUTORIAL_STEPS).toHaveLength(8);
    const ids = TUTORIAL_STEPS.map((s) => s.target);
    expect(new Set(ids).size).toBe(8);
    TUTORIAL_STEPS.forEach((s) => {
      expect(s.route).toMatch(/^\//);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.body.length).toBeGreaterThan(0);
    });
  });

  it("start activates the tutorial at step 0", () => {
    renderHarness();
    expect(screen.getByTestId("active").textContent).toBe("false");
    fireEvent.click(screen.getByText("start"));
    expect(screen.getByTestId("active").textContent).toBe("true");
    expect(screen.getByTestId("index").textContent).toBe("0");
    expect(screen.getByTestId("title").textContent).toBe("Welcome to RoofDynamics");
  });

  it("next advances and back returns", () => {
    renderHarness();
    fireEvent.click(screen.getByText("start"));
    fireEvent.click(screen.getByText("next"));
    expect(screen.getByTestId("index").textContent).toBe("1");
    expect(screen.getByTestId("title").textContent).toBe("One-Man Empire Autopilot");
    fireEvent.click(screen.getByText("back"));
    expect(screen.getByTestId("index").textContent).toBe("0");
  });

  it("back cannot go below step 0", () => {
    renderHarness();
    fireEvent.click(screen.getByText("start"));
    fireEvent.click(screen.getByText("back"));
    expect(screen.getByTestId("index").textContent).toBe("0");
  });

  it("finishing the last step completes and persists to localStorage", () => {
    renderHarness();
    fireEvent.click(screen.getByText("start"));
    for (let i = 0; i < TUTORIAL_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByText("next"));
    }
    expect(screen.getByTestId("index").textContent).toBe("7");
    expect(screen.getByTestId("title").textContent).toBe("WA Statutory Compliance");
    fireEvent.click(screen.getByText("next"));
    expect(screen.getByTestId("active").textContent).toBe("false");
    expect(screen.getByTestId("completed").textContent).toBe("true");
    expect(localStorage.getItem("rd_tutorial_completed")).toBe("true");
  });

  it("skip completes and persists to localStorage", () => {
    renderHarness();
    fireEvent.click(screen.getByText("start"));
    fireEvent.click(screen.getByText("skip"));
    expect(screen.getByTestId("active").textContent).toBe("false");
    expect(localStorage.getItem("rd_tutorial_completed")).toBe("true");
  });

  it("auto-starts on first authenticated session", async () => {
    mockAuth.isAuthenticated = true;
    renderHarness();
    await waitFor(
      () => expect(screen.getByTestId("active").textContent).toBe("true"),
      { timeout: 2000 }
    );
  });

  it("auto-starts after the login transition (mounted unauthenticated)", async () => {
    mockAuth.isAuthenticated = false;
    const { rerender } = renderHarness();
    expect(screen.getByTestId("active").textContent).toBe("false");

    mockAuth.isAuthenticated = true;
    rerender(
      <TutorialProvider>
        <Harness />
      </TutorialProvider>
    );

    await waitFor(
      () => expect(screen.getByTestId("active").textContent).toBe("true"),
      { timeout: 2000 }
    );
  });

  it("does not auto-start once the tutorial is completed", async () => {
    mockAuth.isAuthenticated = true;
    localStorage.setItem("rd_tutorial_completed", "true");
    renderHarness();
    await new Promise((r) => setTimeout(r, 900));
    expect(screen.getByTestId("active").textContent).toBe("false");
  });
});

describe("Tutorial overlay", () => {
  beforeEach(() => {
    store.clear();
    sessionStorage.clear();
    installLocalStorage();
    mockAuth.isAuthenticated = false;
  });

  it("renders the spotlight dialog with progress when active", async () => {
    mockAuth.isAuthenticated = true;
    render(
      <MemoryRouter>
        <TutorialProvider>
          <Tutorial />
        </TutorialProvider>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy(), {
      timeout: 2000,
    });
    expect(screen.getByText("Welcome to RoofDynamics")).toBeTruthy();
    expect(screen.getByText("Step 1 of 8")).toBeTruthy();
    expect(screen.getByText("Skip tour")).toBeTruthy();
  });
});
