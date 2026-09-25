"use client";

import { PopupList, useAuth } from "@payloadcms/ui";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";

import type {
  AdminDensityRuntimeProps,
  AdminThemeRuntimeProps,
  AdminUIDensity,
  AdminUIThemesProviderProps,
} from "../types.js";

import "../styles/density.css";

const themeChangeEvent = "payload-admin-ui-themes:theme-change";
const densityChangeEvent = "payload-admin-ui-themes:density-change";

const getUserStorageKey = (storageKey: string, userID: unknown): string =>
  `${storageKey}:${typeof userID === "string" || typeof userID === "number" ? userID : "guest"}`;

const getUserValue = (user: unknown, field: string): unknown => {
  if (!user || typeof user !== "object") return undefined;
  return (user as Record<string, unknown>)[field];
};

const useAdminTheme = (props: AdminThemeRuntimeProps) => {
  const { user } = useAuth();
  const userID = getUserValue(user, "id");
  const role = getUserValue(user, props.roleField);
  const enforcedTheme =
    props.enforcement &&
    (!props.enforcement.roles?.length ||
      props.enforcement.roles.includes(String(role)))
      ? props.enforcement.theme
      : null;
  const storageKey = useMemo(
    () => getUserStorageKey(props.storageKey, userID),
    [props.storageKey, userID],
  );
  const themeIDs = useMemo(
    () => new Set(props.themes.map((theme) => theme.id)),
    [props.themes],
  );
  const [preference, setPreference] = useState(props.defaultTheme);
  const theme = enforcedTheme || preference;

  useEffect(() => {
    const syncPreference = () => {
      const savedTheme = window.localStorage.getItem(storageKey);
      setPreference(
        savedTheme && themeIDs.has(savedTheme)
          ? savedTheme
          : props.defaultTheme,
      );
    };
    const syncStoredPreference = (event: StorageEvent) => {
      if (event.key === storageKey) syncPreference();
    };

    syncPreference();
    window.addEventListener(themeChangeEvent, syncPreference);
    window.addEventListener("storage", syncStoredPreference);

    return () => {
      window.removeEventListener(themeChangeEvent, syncPreference);
      window.removeEventListener("storage", syncStoredPreference);
    };
  }, [props.defaultTheme, storageKey, themeIDs]);

  useLayoutEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
  }, [theme]);

  const updateTheme = (nextTheme: string) => {
    if (enforcedTheme || !themeIDs.has(nextTheme)) return;

    setPreference(nextTheme);
    document.documentElement.dataset.adminTheme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  };

  return { enforcedTheme, theme, updateTheme };
};

const isDensity = (value: null | string): value is AdminUIDensity =>
  value === "comfortable" || value === "compact";

const useAdminDensity = (props: AdminDensityRuntimeProps | null) => {
  const [density, setDensity] = useState<AdminUIDensity>(
    props?.defaultDensity || "comfortable",
  );

  useEffect(() => {
    if (!props) {
      delete document.documentElement.dataset.density;
      return;
    }

    const syncDensity = () => {
      const savedDensity = window.localStorage.getItem(props.storageKey);
      const nextDensity = isDensity(savedDensity)
        ? savedDensity
        : props.defaultDensity;
      setDensity(nextDensity);
      document.documentElement.dataset.density = nextDensity;
    };
    const syncStoredDensity = (event: StorageEvent) => {
      if (event.key === props.storageKey) syncDensity();
    };

    syncDensity();
    window.addEventListener(densityChangeEvent, syncDensity);
    window.addEventListener("storage", syncStoredDensity);

    return () => {
      window.removeEventListener(densityChangeEvent, syncDensity);
      window.removeEventListener("storage", syncStoredDensity);
    };
  }, [props]);

  const updateDensity = (nextDensity: AdminUIDensity) => {
    if (!props) return;

    setDensity(nextDensity);
    document.documentElement.dataset.density = nextDensity;
    window.localStorage.setItem(props.storageKey, nextDensity);
    window.dispatchEvent(new Event(densityChangeEvent));
  };

  return { density, updateDensity };
};

export function AdminUIThemesProvider({
  children,
  density,
  ...themeProps
}: AdminUIThemesProviderProps) {
  useAdminTheme(themeProps);
  useAdminDensity(density);
  return children;
}

export function AdminThemeMenuSetting(props: AdminThemeRuntimeProps) {
  const { enforcedTheme, theme, updateTheme } = useAdminTheme(props);

  return (
    <div data-popup-prevent-close>
      <PopupList.RadioGroup>
        {props.themes.map((option) => (
          <PopupList.RadioGroupItem
            active={theme === option.id}
            disabled={Boolean(enforcedTheme)}
            key={option.id}
            onClick={() => updateTheme(option.id)}
          >
            {option.label}
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
    </div>
  );
}

export function AdminDensityMenuSetting(props: AdminDensityRuntimeProps) {
  const { density, updateDensity } = useAdminDensity(props);

  return (
    <div data-popup-prevent-close>
      <PopupList.RadioGroup>
        <PopupList.RadioGroupItem
          active={density === "comfortable"}
          onClick={() => updateDensity("comfortable")}
        >
          Comfortable
        </PopupList.RadioGroupItem>
        <PopupList.RadioGroupItem
          active={density === "compact"}
          onClick={() => updateDensity("compact")}
        >
          Compact
        </PopupList.RadioGroupItem>
      </PopupList.RadioGroup>
    </div>
  );
}
