"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setDark(!dark);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="h-6 w-6 flex items-center justify-center text-lg leading-none hover:opacity-70 transition-opacity"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
