import type {
  Config,
  PayloadComponent,
  Plugin,
  UserMenuSettingsItem,
} from "payload";

import type {
  AdminDensityRuntimeProps,
  AdminThemeRuntimeProps,
  AdminUITheme,
  PayloadAdminUIThemesOptions,
} from "./types.js";

const clientComponentPath = "payload-admin-ui-themes/client";

const componentMatches = (
  component: PayloadComponent | undefined,
  path: string,
  exportName?: string,
): boolean => {
  if (typeof component === "string") {
    return component === `${path}${exportName ? `#${exportName}` : ""}`;
  }

  return Boolean(
    component &&
    typeof component === "object" &&
    component.path === path &&
    (!exportName || component.exportName === exportName),
  );
};

const settingsContainComponent = (
  settings: UserMenuSettingsItem[],
  path: string,
  exportName: string,
): boolean =>
  settings.some((item) => {
    if (typeof item === "object" && item && "items" in item) {
      return item.items.some((component) =>
        componentMatches(component, path, exportName),
      );
    }

    return componentMatches(item, path, exportName);
  });

const validateThemes = ({
  defaultTheme,
  enforcement,
  themes,
}: PayloadAdminUIThemesOptions) => {
  if (!themes.length)
    throw new Error("payload-admin-ui-themes requires at least one theme.");

  const themeIDs = themes.map((theme) => theme.id);
  const duplicates = themeIDs.filter(
    (id, index) => themeIDs.indexOf(id) !== index,
  );

  if (duplicates.length) {
    throw new Error(
      `Admin UI theme IDs must be unique: ${[...new Set(duplicates)].join(", ")}`,
    );
  }

  if (!themeIDs.includes(defaultTheme)) {
    throw new Error(
      `The default Admin UI theme "${defaultTheme}" is not registered.`,
    );
  }

  if (enforcement && !themeIDs.includes(enforcement.theme)) {
    throw new Error(
      `The enforced Admin UI theme "${enforcement.theme}" is not registered.`,
    );
  }
};

const getThemeProvider = (theme: AdminUITheme): PayloadComponent | null =>
  theme.Provider || null;

export const payloadAdminUIThemes =
  (options: PayloadAdminUIThemesOptions): Plugin =>
  (config: Config): Config => {
    if (options.disabled) return config;

    validateThemes(options);

    const existingComponents = config.admin?.components || {};
    const existingProviders = existingComponents.providers || [];
    const existingSettings = existingComponents.userMenuSettingsItems || [];
    const themeRuntimeProps: AdminThemeRuntimeProps = {
      defaultTheme: options.defaultTheme,
      enforcement: options.enforcement || null,
      roleField: options.roleField || "role",
      storageKey: options.storageKey || "payload-admin-ui-theme",
      themes: options.themes.map(({ Provider: _Provider, ...theme }) => theme),
    };
    const densityOptions = options.density === false ? null : options.density;
    const densityRuntimeProps: AdminDensityRuntimeProps | null =
      options.density === false || options.density?.enabled === false
        ? null
        : {
            defaultDensity: densityOptions?.defaultDensity || "comfortable",
            storageKey:
              densityOptions?.storageKey || "payload-admin-ui-density",
          };

    const themeStyleProviders = options.themes
      .map(getThemeProvider)
      .filter((provider): provider is Exclude<PayloadComponent, false> =>
        Boolean(provider),
      )
      .filter(
        (provider) =>
          !existingProviders.some((existingProvider) => {
            if (typeof provider === "string")
              return existingProvider === provider;
            return componentMatches(
              existingProvider,
              provider.path,
              provider.exportName,
            );
          }),
      );

    const providerComponent = {
      clientProps: {
        ...themeRuntimeProps,
        density: densityRuntimeProps,
      },
      exportName: "AdminUIThemesProvider",
      path: clientComponentPath,
    };
    const themeMenuComponent = {
      clientProps: themeRuntimeProps,
      exportName: "AdminThemeMenuSetting",
      path: clientComponentPath,
    };
    const densityMenuComponent = densityRuntimeProps
      ? {
          clientProps: densityRuntimeProps,
          exportName: "AdminDensityMenuSetting",
          path: clientComponentPath,
        }
      : null;

    const providers = [
      ...existingProviders,
      ...themeStyleProviders,
      ...(existingProviders.some((provider) =>
        componentMatches(
          provider,
          clientComponentPath,
          "AdminUIThemesProvider",
        ),
      )
        ? []
        : [providerComponent]),
    ];
    const userMenuSettingsItems: UserMenuSettingsItem[] = [
      ...existingSettings,
      ...(settingsContainComponent(
        existingSettings,
        clientComponentPath,
        "AdminThemeMenuSetting",
      )
        ? []
        : [
            {
              group: options.settingsGroup || "Admin theme",
              items: [themeMenuComponent],
            },
          ]),
      ...(!densityMenuComponent ||
      settingsContainComponent(
        existingSettings,
        clientComponentPath,
        "AdminDensityMenuSetting",
      )
        ? []
        : [
            {
              group: densityOptions?.settingsGroup || "Density",
              items: [densityMenuComponent],
            },
          ]),
    ];

    return {
      ...config,
      admin: {
        ...config.admin,
        components: {
          ...existingComponents,
          providers,
          userMenuSettingsItems,
        },
      },
    };
  };
