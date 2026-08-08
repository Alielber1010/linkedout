type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeTheme(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getThemeSnapshot() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export function getThemeServerSnapshot() {
  return false;
}

export function setTheme(dark: boolean) {
  const theme = dark ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  listeners.forEach((listener) => listener());
}
