/* Two-option segmented control, adapted to the existing Tabler/vanilla UI.
 * Reference: https://21st.dev/@ncdai/components/theme-switcher-1 */
(() => {
  "use strict";
  if (window.siteTheme) return;
  const root = document.documentElement;
  const key = "portfolio-theme";
  const switches = Array.from(document.querySelectorAll("[data-theme-switcher]"));
  let status;
  const valid = (value) => value === "light" || value === "dark";

  function locale() {
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested === "ru" || requested === "en") return requested;
    if (window.siteI18n?.locale) return window.siteI18n.locale;
    try {
      const saved = localStorage.getItem("portfolio-language");
      if (saved === "ru" || saved === "en") return saved;
    } catch { /* The document language remains available without storage. */ }
    return root.lang === "ru" ? "ru" : "en";
  }

  function labels() {
    return locale() === "ru"
      ? { group: "Цветовая тема", light: "Включить светлую тему", dark: "Включить тёмную тему", onLight: "Светлая тема включена", onDark: "Тёмная тема включена" }
      : { group: "Color theme", light: "Switch to light theme", dark: "Switch to dark theme", onLight: "Light theme enabled", onDark: "Dark theme enabled" };
  }

  function sync() {
    const text = labels();
    switches.forEach((control) => {
      control.setAttribute("aria-label", text.group);
      control.lang = locale();
      control.querySelectorAll("[data-theme-option]").forEach((button) => {
        const selected = button.dataset.themeOption === root.dataset.theme;
        button.setAttribute("aria-checked", String(selected));
        button.setAttribute("aria-label", text[button.dataset.themeOption]);
        button.title = text[button.dataset.themeOption];
        button.tabIndex = selected ? 0 : -1;
      });
    });
  }

  function setTheme(value, persist = true, announce = false) {
    if (!valid(value)) return;
    const changed = root.dataset.theme !== value;
    root.dataset.theme = value;
    root.style.colorScheme = value;
    root.style.backgroundColor = value === "light" ? "#f7f7f4" : "#050505";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", value === "light" ? "#f7f7f4" : "#050505");
    if (persist) {
      try { localStorage.setItem(key, value); } catch { /* The current page still switches if storage is blocked. */ }
    }
    sync();
    if (changed) {
      window.dispatchEvent(new CustomEvent("portfolio:themechange", { detail: { theme: value } }));
      if (announce && status) {
        const text = labels();
        status.lang = locale();
        status.textContent = value === "light" ? text.onLight : text.onDark;
      }
    }
  }

  window.siteTheme = { setTheme, get current() { return root.dataset.theme; } };
  status = document.createElement("span");
  status.className = "theme-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  document.body.append(status);

  switches.forEach((control) => {
    const buttons = Array.from(control.querySelectorAll("[data-theme-option]"));
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => setTheme(button.dataset.themeOption, true, true));
      button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        setTheme(buttons[next].dataset.themeOption, true, true);
        buttons[next].focus({ preventScroll: true });
      });
    });
  });
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["lang"] });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) setTheme(valid(event.newValue) ? event.newValue : "dark", false);
  });
  setTheme(valid(root.dataset.theme) ? root.dataset.theme : "dark", false);
})();
