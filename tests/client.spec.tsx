import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const uiMocks = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@payloadcms/ui", async () => {
  const ReactModule = await import("react");

  return {
    PopupList: {
      RadioGroup: ({ children }: { children: React.ReactNode }) =>
        ReactModule.createElement("div", { role: "radiogroup" }, children),
      RadioGroupItem: ({
        active,
        children,
        disabled,
        onClick,
      }: {
        active?: boolean;
        children: React.ReactNode;
        disabled?: boolean;
        onClick?: () => void;
      }) =>
        ReactModule.createElement(
          "button",
          { "aria-pressed": active, disabled, onClick },
          children,
        ),
    },
    useAuth: uiMocks.useAuth,
  };
});

import {
  AdminDensityMenuSetting,
  AdminThemeMenuSetting,
  AdminUIThemesProvider,
} from "../src/exports/client.js";

const themeProps = {
  defaultTheme: "light-cream",
  enforcement: null,
  roleField: "role",
  storageKey: "test-admin-theme",
  themes: [
    { id: "stock", label: "Stock" },
    { id: "light-cream", label: "Light Cream" },
  ],
};

describe("Admin UI theme client", () => {
  beforeEach(() => {
    uiMocks.useAuth.mockReturnValue({
      user: { id: "editor-1", role: "content-editor" },
    });
    window.localStorage.clear();
    delete document.documentElement.dataset.adminTheme;
    delete document.documentElement.dataset.density;
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    delete document.documentElement.dataset.adminTheme;
    delete document.documentElement.dataset.density;
  });

  it("stores theme preferences per user", async () => {
    render(
      <AdminUIThemesProvider {...themeProps} density={null}>
        <AdminThemeMenuSetting {...themeProps} />
      </AdminUIThemesProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Stock" }));

    await waitFor(() =>
      expect(document.documentElement.dataset.adminTheme).toBe("stock"),
    );
    expect(window.localStorage.getItem("test-admin-theme:editor-1")).toBe(
      "stock",
    );
  });

  it("enforces a theme for selected roles", () => {
    const enforcedProps = {
      ...themeProps,
      enforcement: { roles: ["content-editor"], theme: "light-cream" },
    };

    render(<AdminThemeMenuSetting {...enforcedProps} />);

    expect(document.documentElement.dataset.adminTheme).toBe("light-cream");
    expect(
      screen.getByRole("button", { name: "Stock" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("applies density independently from theme selection", async () => {
    document.documentElement.dataset.adminTheme = "stock";
    const densityProps = {
      defaultDensity: "comfortable" as const,
      storageKey: "test-density",
    };

    render(<AdminDensityMenuSetting {...densityProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Compact" }));

    await waitFor(() =>
      expect(document.documentElement.dataset.density).toBe("compact"),
    );
    expect(document.documentElement.dataset.adminTheme).toBe("stock");
  });
});
