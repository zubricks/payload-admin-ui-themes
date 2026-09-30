<img width="1200" height="801" alt="Admin UI Theme Header" src="https://github.com/user-attachments/assets/f0ae499b-f33a-4ec8-9bc3-db37acf793ab" />

# Installable, user-selectable Admin UI themes for Payload 4.

The plugin registers an Admin theme picker in Payload's user Settings menu. Themes are code-owned,
versioned packages: editors choose from the themes installed by the project, while developers keep
CSS in source control. Theme choice is stored per user in the browser. A project can also enforce a
theme globally or for selected roles.

## Install

```bash
pnpm add @zubricks/payload-admin-ui-themes
```

*this plugin is currently only supported for Payload 4.0*

## Configure

```ts
import { payloadAdminUIThemes } from "@zubricks/payload-admin-ui-themes";
import { lightCreamTheme } from "@zubricks/payload-admin-ui-themes/themes/light-cream";
import { stockTheme } from "@zubricks/payload-admin-ui-themes/themes/stock";

export default buildConfig({
  plugins: [
    payloadAdminUIThemes({
      themes: [stockTheme, lightCreamTheme],
      defaultTheme: "light-cream",
      density: {
        defaultDensity: "comfortable",
      },
    }),
  ],
});
```

The plugin preserves existing Admin providers and Settings items. It adds:

- A per-user Admin theme selector
- Optional Comfortable and Compact density settings
- CSS providers for every registered theme
- Optional global or role-based theme enforcement

## Enforce a theme

For every Admin user:

```ts
payloadAdminUIThemes({
  themes: [stockTheme, lightCreamTheme],
  defaultTheme: "light-cream",
  enforcement: {
    theme: "light-cream",
  },
});
```

For selected roles:

```ts
enforcement: {
  roles: ['content-editor'],
  theme: 'light-cream',
}
```

Use `roleField` when the user's role is stored somewhere other than `role`.

## Create a theme package

A theme is a serializable manifest plus an optional Payload client provider that imports its CSS:

```ts
import type { AdminUITheme } from "@zubricks/payload-admin-ui-themes";

export const northstarTheme: AdminUITheme = {
  id: "northstar",
  label: "Northstar",
  description: "Editorial styling with a green accent.",
  Provider: "payload-admin-theme-northstar/client#NorthstarThemeProvider",
};
```

```tsx
"use client";

import "./theme.css";

export function NorthstarThemeProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  return children;
}
```

```css
html[data-admin-theme="northstar"] {
  --ramp-blue-500: #83bf78;
  --color-bg: #faf7ed;
  --color-text-brand: #376b35;
}

html[data-admin-theme="northstar"][data-theme="dark"] {
  --color-bg: #171a16;
  --color-text-brand: #add6a5;
}
```

The included Light Cream stylesheet is intentionally organized as a theme-authoring reference. A
theme should use Payload's public semantic variables instead of implementation class names.

## Options

- `themes`: installed theme manifests
- `defaultTheme`: initial selection when a user has no saved preference
- `enforcement`: optionally force a theme globally or by role
- `roleField`: user property used for role enforcement; defaults to `role`
- `storageKey`: local-storage namespace for theme preferences
- `settingsGroup`: label in the user Settings menu
- `density`: density configuration, or `false` to disable it
- `disabled`: return the Payload config unchanged
