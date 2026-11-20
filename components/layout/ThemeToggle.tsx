"use client";

import { useLayoutEffect, useState } from "react";

const THEME_KEY = "jdd-theme";

function readInitialNight() {
  if (typeof document !== "undefined" && document.body.classList.contains("night")) {
    return true;
  }
  try {
    return localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    return false;
  }
}

function applyTheme(night: boolean) {
  document.body.classList.toggle("night", night);
  const theme = document.querySelector('meta[name="theme-color"]') || document.createElement("meta");
  theme.setAttribute("name", "theme-color");
  theme.setAttribute("content", night ? "#111110" : "#F4F4F2");
  if (!theme.parentElement) document.head.appendChild(theme);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function commitTheme(
  nextNight: boolean,
  setNight: (value: boolean) => void,
) {
  setNight(nextNight);
  try {
    localStorage.setItem(THEME_KEY, nextNight ? "dark" : "light");
  } catch {}
  applyTheme(nextNight);
}

export default function ThemeToggle() {
  const [night, setNight] = useState(readInitialNight);

  useLayoutEffect(() => {
    const initialNight = readInitialNight();
    setNight(initialNight);
    applyTheme(initialNight);
  }, []);

  function toggleTheme() {
    const nextNight = !night;

    if (prefersReducedMotion() || typeof document.startViewTransition !== "function") {
      commitTheme(nextNight, setNight);
      return;
    }

    document.startViewTransition(() => {
      commitTheme(nextNight, setNight);
    });
  }

  return (
    <button
      className="theme"
      type="button"
      aria-label={night ? "Switch to day" : "Switch to night"}
      aria-pressed={night}
      onClick={toggleTheme}
    >
      <svg className="moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
      <svg className="sunic" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </svg>
    </button>
  );
}
