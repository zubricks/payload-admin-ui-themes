import type { Config } from "payload";
import { describe, expect, it } from "vitest";

import { payloadAdminUIThemes } from "../src/plugin.js";
import { lightCreamTheme } from "../src/themes/lightCream/index.js";
import { stockTheme } from "../src/themes/stock.js";

const baseConfig = {
  admin: {
    components: {
      providers: ["example/provider#ExistingProvider"],
      userMenuSettingsItems: [
        {
          group: "Existing",
          items: ["example/menu#ExistingSetting"],
        },
      ],
    },
  },
  collections: [],
} as unknown as Config;

const options = {
  defaultTheme: "light-cream",
  density: { defaultDensity: "comfortable" as const },
  themes: [stockTheme, lightCreamTheme],
};

describe("payloadAdminUIThemes", () => {
  it("preserves Admin components and registers theme providers and settings", async () => {
    const transformed = await payloadAdminUIThemes(options)(baseConfig);
    const components = transformed.admin?.components;

    expect(components?.providers).toEqual(
      expect.arrayContaining([
        "example/provider#ExistingProvider",
        "@zubricks/payload-admin-ui-themes/themes/light-cream/client#LightCreamThemeProvider",
        expect.objectContaining({
          exportName: "AdminUIThemesProvider",
          path: "@zubricks/payload-admin-ui-themes/client",
        }),
      ]),
    );
    expect(components?.userMenuSettingsItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ group: "Existing" }),
        expect.objectContaining({ group: "Admin theme" }),
        expect.objectContaining({ group: "Density" }),
      ]),
    );
  });

  it("is idempotent", async () => {
    const once = await payloadAdminUIThemes(options)(baseConfig);
    const twice = await payloadAdminUIThemes(options)(once);
    const providers = twice.admin?.components?.providers || [];

    expect(
      providers.filter(
        (provider) =>
          typeof provider === "object" &&
          provider.exportName === "AdminUIThemesProvider",
      ),
    ).toHaveLength(1);
  });

  it("validates defaults and enforced themes", () => {
    expect(() =>
      payloadAdminUIThemes({ defaultTheme: "missing", themes: [stockTheme] })(
        baseConfig,
      ),
    ).toThrow(/default Admin UI theme/i);

    expect(() =>
      payloadAdminUIThemes({
        defaultTheme: "stock",
        enforcement: { theme: "missing" },
        themes: [stockTheme],
      })(baseConfig),
    ).toThrow(/enforced Admin UI theme/i);
  });
});
