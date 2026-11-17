import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeatureGate } from "./FeatureGate";
import { AuthProvider } from "../contexts/AuthContext";

// Mock the auth context
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    tenant: {
      id: "tenant-2",
      name: "Swan Valley Roof Restorations",
      subscriptionTier: "PRO_SAFETY",
      moduleEntitlements: [
        { moduleKey: "CRM_QUOTING", isEnabled: true },
        { moduleKey: "WMS_MRP", isEnabled: false },
      ],
    },
    setTenant: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the API
vi.mock("../services/api", () => ({
  api: {
    updateEntitlement: vi.fn().mockResolvedValue({}),
  },
}));

describe("FeatureGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when module is enabled", () => {
    render(
      <FeatureGate moduleKey="CRM_QUOTING">
        <div>CRM Content</div>
      </FeatureGate>
    );
    expect(screen.getByText("CRM Content")).toBeInTheDocument();
  });

  it("renders upsell card when module is locked", () => {
    render(
      <FeatureGate moduleKey="WMS_MRP">
        <div>WMS Content</div>
      </FeatureGate>
    );
    expect(screen.queryByText("WMS Content")).not.toBeInTheDocument();
    expect(screen.getByText(/Locked/i)).toBeInTheDocument();
  });

  it("shows unlock button on locked module", () => {
    render(
      <FeatureGate moduleKey="WMS_MRP">
        <div>WMS Content</div>
      </FeatureGate>
    );
    expect(screen.getByText("Unlock Module")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <FeatureGate moduleKey="WMS_MRP" fallback={<div>Custom Fallback</div>}>
        <div>WMS Content</div>
      </FeatureGate>
    );
    expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
  });
});
