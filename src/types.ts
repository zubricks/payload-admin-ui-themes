import type { PayloadComponent } from "payload";
import type React from "react";

export type AdminUITheme = {
  description?: string;
  id: string;
  label: string;
  /** Client provider that imports this theme's CSS. Stock themes can omit it. */
  Provider?: PayloadComponent<
    { children?: React.ReactNode },
    { children?: React.ReactNode }
  >;
};

export type AdminUIThemeClientDefinition = Omit<AdminUITheme, "Provider">;

export type AdminUIThemeEnforcement = {
  /** Omit roles to enforce the theme for every Admin user. */
  roles?: string[];
  theme: string;
};

export type AdminUIDensity = "comfortable" | "compact";

export type AdminUIDensityOptions = {
  defaultDensity?: AdminUIDensity;
  enabled?: boolean;
  settingsGroup?: string;
  storageKey?: string;
};

export type PayloadAdminUIThemesOptions = {
  defaultTheme: string;
  density?: AdminUIDensityOptions | false;
  disabled?: boolean;
  enforcement?: AdminUIThemeEnforcement | null;
  /** User property containing the role used by `enforcement.roles`. */
  roleField?: string;
  settingsGroup?: string;
  storageKey?: string;
  themes: AdminUITheme[];
};

export type AdminThemeRuntimeProps = {
  defaultTheme: string;
  enforcement: AdminUIThemeEnforcement | null;
  roleField: string;
  storageKey: string;
  themes: AdminUIThemeClientDefinition[];
};

export type AdminDensityRuntimeProps = {
  defaultDensity: AdminUIDensity;
  storageKey: string;
};

export type AdminUIThemesProviderProps = AdminThemeRuntimeProps & {
  children?: React.ReactNode;
  density: AdminDensityRuntimeProps | null;
};
