/* Two-option segmented control, adapted to the existing Tabler/vanilla UI.
 * Reference: https://21st.dev/@ncdai/components/theme-switcher-1
 * Organic theme reveal adapted from 000h by Cojeev (MIT):
 * https://cojeev.com/ui/docs/theme-toggle/ — see vendor/cojeev-LICENSE.txt. */
(() => {
  "use strict";
  if (window.siteTheme) return;
  const root = document.documentElement;
  const key = "portfolio-theme";
  const switches = Array.from(document.querySelectorAll("[data-theme-switcher]"));
  const toggles = Array.from(document.querySelectorAll("[data-theme-toggle]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeReveal;
  let previousZone = -1;
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
      ? { group: "Цветовая тема", light: "Включить светлую тему", dark: "Включить тёмную тему", lightLabel: "Светлая тема", darkLabel: "Тёмная тема", onLight: "Светлая тема включена", onDark: "Тёмная тема включена" }
      : { group: "Color theme", light: "Switch to light theme", dark: "Switch to dark theme", lightLabel: "Light theme", darkLabel: "Dark theme", onLight: "Light theme enabled", onDark: "Dark theme enabled" };
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
    toggles.forEach((button) => {
      const dark = root.dataset.theme === "dark";
      button.lang = locale();
      button.setAttribute("aria-checked", String(dark));
      button.setAttribute("aria-label", dark ? text.light : text.dark);
      button.title = dark ? text.light : text.dark;
      button.querySelector("[data-theme-toggle-label]").textContent = dark ? text.darkLabel : text.lightLabel;
    });
  }

  function commitTheme(value, persist = true, announce = false) {
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

  // Twelve smooth lobes expand from a varied origin, just like the reference.
  // Only a native view snapshot is clipped; the live page keeps its scroll,
  // media playback, focus and existing entrance animations.
  function revealPath(progress, origin, width, height, phase) {
    const reach = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y)) / 0.72;
    const points = Array.from({ length: 12 }, (_, index) => {
      const angle = index * Math.PI / 6;
      const radius = reach * progress * (1 + 0.12 * Math.sin(angle * 3 + progress * 0.65 + phase) + 0.065 * Math.cos(angle * 5 - progress * 0.35 - phase * 0.7));
      return { x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius };
    });
    const f = (number) => Number(number.toFixed(2));
    let path = `M${f(points[0].x)} ${f(points[0].y)}`;
    points.forEach((start, index) => {
      const before = points[(index + 11) % 12], end = points[(index + 1) % 12], after = points[(index + 2) % 12];
      path += `C${f(start.x + (end.x - before.x) / 6)} ${f(start.y + (end.y - before.y) / 6)} ${f(end.x - (after.x - start.x) / 6)} ${f(end.y - (after.y - start.y) / 6)} ${f(end.x)} ${f(end.y)}`;
    });
    return path + "Z";
  }

  function revealEase(progress) {
    // Cubic-bezier(.42, 0, .18, 1), matching the supplied transition.
    let low = 0, high = 1;
    for (let index = 0; index < 12; index += 1) {
      const t = (low + high) / 2;
      const x = 3 * (1 - t) ** 2 * t * 0.42 + 3 * (1 - t) * t ** 2 * 0.18 + t ** 3;
      if (x < progress) low = t; else high = t;
    }
    const t = (low + high) / 2;
    return 3 * (1 - t) * t ** 2 + t ** 3;
  }

  function setTheme(value, persist = true, announce = false) {
    if (!valid(value)) return;
    activeReveal?.finish();
    commitTheme(value, persist, announce);
  }

  function chooseTheme(value, control) {
    if (!valid(value) || activeReveal?.value === value) return;
    activeReveal?.finish();
    if (root.dataset.theme === value) return;
    if (reducedMotion.matches || document.hidden || typeof document.startViewTransition !== "function" || !window.CSS?.supports("clip-path", 'path("M0 0L1 0L1 1Z")')) {
      commitTheme(value, true, true);
      return;
    }
    const width = root.clientWidth, height = root.clientHeight;
    const zones = [[0.07, 0.07], [0.93, 0.07], [0.93, 0.93], [0.07, 0.93], [0.06, 0.5], [0.94, 0.5], [0.5, 0.06], [0.5, 0.94], [0.5, 0.5]];
    let zone = Math.floor(Math.random() * (previousZone < 0 ? 9 : 8));
    if (previousZone >= 0 && zone >= previousZone) zone += 1;
    previousZone = zone;
    const origin = {
      x: Math.max(12, Math.min(width - 12, width * (zones[zone][0] + (Math.random() - 0.5) * 0.07))),
      y: Math.max(12, Math.min(height - 12, height * (zones[zone][1] + (Math.random() - 0.5) * 0.07))),
    };
    const phase = Math.random() * Math.PI * 2;
    const duration = 1200 + Math.random() * 180;
    // Keep the activated switch visible in the destination snapshot throughout.
    const box = control.getBoundingClientRect();
    const controlPath = `M${box.left} ${box.top}H${box.right}V${box.bottom}H${box.left}Z`;
    let frame = 0, timeout = 0, committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      commitTheme(value, true, true);
    };
    const interrupt = () => reveal.finish();
    const quietChanged = () => { if (reducedMotion.matches || document.hidden) reveal.finish(); };
    const reveal = {
      value, view: null, done: false,
      finish() {
        if (reveal.done) return;
        reveal.done = true;
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
        commit();
        reveal.view?.skipTransition();
        document.removeEventListener("scroll", interrupt, true);
        window.removeEventListener("resize", interrupt);
        window.removeEventListener("pagehide", interrupt);
        document.removeEventListener("visibilitychange", quietChanged);
        reducedMotion.removeEventListener("change", quietChanged);
        if (activeReveal === reveal) {
          root.removeAttribute("data-theme-reveal");
          root.style.removeProperty("--theme-reveal-clip");
          activeReveal = undefined;
        }
      },
    };
    const paint = (progress) => root.style.setProperty("--theme-reveal-clip", `path("${revealPath(progress, origin, width, height, phase)}${controlPath}")`);
    activeReveal = reveal;
    root.setAttribute("data-theme-reveal", value);
    paint(0);
    document.addEventListener("scroll", interrupt, { capture: true, passive: true });
    window.addEventListener("resize", interrupt, { passive: true });
    window.addEventListener("pagehide", interrupt);
    document.addEventListener("visibilitychange", quietChanged);
    reducedMotion.addEventListener("change", quietChanged);
    timeout = window.setTimeout(interrupt, 3000);
    try {
      reveal.view = document.startViewTransition(() => { if (!reveal.done) commit(); });
      reveal.view.ready.then(() => {
        if (reveal.done) return;
        if (reducedMotion.matches || document.hidden) { reveal.finish(); return; }
        const start = performance.now();
        const tick = (time) => {
          if (reveal.done) return;
          const progress = Math.max(0, Math.min(1, (time - start) / duration));
          paint(revealEase(progress));
          if (progress === 1) reveal.finish();
          else frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
      }, interrupt);
      reveal.view.finished.then(interrupt, interrupt);
    } catch { reveal.finish(); }
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
      button.addEventListener("click", () => chooseTheme(button.dataset.themeOption, button));
      button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        chooseTheme(buttons[next].dataset.themeOption, buttons[next]);
        buttons[next].focus({ preventScroll: true });
      });
    });
  });
  toggles.forEach((button) => button.addEventListener("click", () => {
    const current = activeReveal?.value || root.dataset.theme;
    chooseTheme(current === "dark" ? "light" : "dark", button);
  }));
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["lang"] });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) setTheme(valid(event.newValue) ? event.newValue : "dark", false);
  });
  setTheme(valid(root.dataset.theme) ? root.dataset.theme : "dark", false);
})();
