"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function ThemeSync() {
  const { state } = useStore();
  useEffect(() => {
    const root = document.documentElement;
    const apply = (theme: "light" | "dark") => {
      root.dataset.theme = theme;
    };
    if (state.settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const onChange = () => apply(mq.matches ? "dark" : "light");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(state.settings.theme);
  }, [state.settings.theme]);
  return null;
}
