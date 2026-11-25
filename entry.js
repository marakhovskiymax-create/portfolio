/* Coordinate the reference GSAP entrance with reload scroll restoration.
 * Styling/localization stay inline; no loader or artificial readiness timer. */
(() => {
  "use strict";
  const root = document.documentElement;
  const key = `portfolio-scroll:${location.pathname}:${window.siteI18n?.locale || root.lang}`;
  const previousRestoration = history.scrollRestoration;
  const previousBehavior = root.style.scrollBehavior || "";
  const previousHeight = root.style.minHeight || "";
  let saved;
  let interacted = false;
  let completed = false;
  let released = false;

  try {
    const navigation = performance.getEntriesByType("navigation")[0];
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    if (navigation?.type === "reload" && value && Number.isFinite(value.y) && value.y >= 0 && Number.isFinite(value.height)) saved = value;
  } catch { /* Native browser restoration remains available if storage is blocked. */ }

  if (saved) {
    history.scrollRestoration = "manual";
    root.style.scrollBehavior = "auto";
    root.style.minHeight = `${Math.max(0, saved.height)}px`;
  }
  root.classList.add("page-motion-pending", "hero-motion-pending");

  function resume() {
    if (!saved || interacted) return;
    const behavior = root.style.scrollBehavior || "";
    root.style.scrollBehavior = "auto";
    window.scrollTo(saved.x || 0, saved.y);
    root.style.scrollBehavior = behavior;
  }

  function save() {
    try {
      sessionStorage.setItem(key, JSON.stringify({ x: window.scrollX, y: window.scrollY, height: root.scrollHeight }));
    } catch { /* No persistent storage is required to use the site. */ }
    if (saved) history.scrollRestoration = previousRestoration;
  }

  function release() {
    if (released) return;
    released = true;
    root.classList.remove("page-motion-pending", "hero-motion-pending", "case-motion-pending");
    if (saved) {
      // Keep anchor/ScrollTrigger restoration instant through the initial load.
      // Restore the author's smooth-navigation preference after loading settles.
      const restoreBehavior = () => { resume(); root.style.scrollBehavior = previousBehavior; };
      if (document.readyState === "complete") restoreBehavior();
      else window.addEventListener("load", restoreBehavior, { once: true });
    }
  }

  function complete() {
    if (completed) return;
    completed = true;
    if (saved) root.style.minHeight = previousHeight;
    resume();
  }

  ["wheel", "touchstart", "pointerdown", "keydown"].forEach((type) => {
    window.addEventListener(type, () => { interacted = true; }, { once: true, passive: true });
  });
  window.addEventListener("pagehide", save);
  window.addEventListener("beforeunload", save);
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted && saved) resume();
  });
  window.addEventListener("error", (event) => {
    if (/\/(?:script|amocrm|gsap-starter)\.js(?:\?|$)/.test(event.filename || "")) release();
  });

  window.siteEntry = {
    reveal: (element) => window.siteI18n?.apply(element),
    resume,
    complete,
    release,
  };
  if (window.siteCriticalScriptFailed) release();
})();
