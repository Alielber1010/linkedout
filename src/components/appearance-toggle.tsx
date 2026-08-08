"use client";

import { useSyncExternalStore } from "react";
import { ToggleSwitch } from "@/components/toggle-switch";
import {
  subscribeTheme,
  getThemeSnapshot,
  getThemeServerSnapshot,
  setTheme,
} from "@/lib/theme-store";

export function AppearanceToggle() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Dark mode</p>
        <p className="text-xs text-secondary mt-0.5">
          Easier on the eyes during a 9pm &quot;urgent&quot; Slack message.
        </p>
      </div>
      <ToggleSwitch checked={dark} onChange={setTheme} label="Dark mode" />
    </div>
  );
}
