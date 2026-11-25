/* Header-only entrance: stabilize its fonts/layout, fade the wordmark, then
 * expand the bar and reveal its controls. Hero/scroll motion is independent. */
(() => {
  "use strict";
  if (window.siteHeaderEntrance) return;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let started = false;
  let finished = false;
  let header;
  let bar;
  let surface;
  let timeline;
  let fontTimer;
  let safetyTimer;
  let frame;
  const snapshots = [];
  root.classList.add("header-motion-pending");

  function remember(element, properties) {
    if (!element) return;
    snapshots.push({ element, properties: properties.map((name) => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]) });
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(fontTimer);
    clearTimeout(safetyTimer);
    if (frame) window.cancelAnimationFrame(frame);
    timeline?.kill();
    surface?.remove();
    snapshots.forEach(({ element, properties }) => {
      properties.forEach(([name, value, priority]) => {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      });
      if (window.gsap) window.gsap.core.getCache(element).uncache = 1;
    });
    header?.classList.remove("header-intro");
    root.classList.remove("header-motion-pending");
  }

  async function start() {
    if (started || finished) return;
    started = true;
    header = document.querySelector(".site-header");
    bar = header?.querySelector(".masthead");
    const logo = bar?.querySelector(".wordmark");
    if (!header || !bar || !logo || !window.gsap) { finish(); return; }

    header.addEventListener("focusin", finish);
    header.addEventListener("click", finish, { capture: true });
    window.addEventListener("resize", finish, { once: true, passive: true });
    reduceMotion.addEventListener?.("change", (event) => { if (event.matches) finish(); });

    try {
      if (document.fonts?.load) {
        const fonts = [document.fonts.load('italic 600 34px "Playfair Display"', logo.textContent)];
        if (!window.matchMedia("(max-width: 1120px)").matches) {
          const text = Array.from(bar.querySelectorAll(".masthead__links--primary > a, .masthead__email, .masthead__resume, .language-menu__label"), (element) => element.textContent).join(" ");
          fonts.push(document.fonts.load('800 16px "Nunito Sans"', text));
        }
        const available = await Promise.race([
          Promise.all(fonts).then(() => true),
          new Promise((resolve) => { fontTimer = setTimeout(() => resolve(false), 1600); }),
        ]);
        clearTimeout(fontTimer);
        if (!available || finished) { finish(); return; }
      }
      if (finished || reduceMotion.matches) { finish(); return; }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (finished) return;
        try {
          // Measure once after localization, label wrapping and the header fonts.
          // Only transforms/opacity/clip-path change during the entrance.
          const bounds = bar.getBoundingClientRect();
          const wordmark = logo.getBoundingClientRect();
          if (!bounds.width || !wordmark.width) { finish(); return; }
          const shift = bounds.left + bounds.width / 2 - (wordmark.left + wordmark.width / 2);
          const inset = Math.max(0, (bounds.width - wordmark.width - 32) / 2);
          const primary = bar.querySelector(".masthead__links--primary");
          const meta = bar.querySelector(".masthead__links--meta");
          const menu = bar.querySelector(".menu-toggle");
          remember(bar, ["width"]);
          remember(logo, ["opacity", "visibility", "transform"]);
          [primary, meta, menu].forEach((element) => remember(element, ["opacity", "visibility", "transform"]));
          bar.style.width = `${bounds.width}px`;
          surface = document.createElement("span");
          surface.className = "header-entry__surface";
          surface.setAttribute("aria-hidden", "true");
          bar.prepend(surface);
          header.classList.add("header-intro");
          const gsap = window.gsap;
          gsap.set(logo, { autoAlpha: 0, x: shift });
          const controls = [primary, meta, menu].filter(Boolean);
          gsap.set(controls, { autoAlpha: 0, y: 6 });
          gsap.set(surface, { autoAlpha: 0, clipPath: `inset(0px ${inset}px round 999px)` });
          timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" }, onComplete: finish });
          timeline.to(logo, { autoAlpha: 1, duration: 0.24 }, 0)
            .to(logo, { x: 0, duration: 0.56 }, 0.22)
            .to(surface, { autoAlpha: 1, clipPath: "inset(0px 0px round 999px)", duration: 0.56 }, 0.22);
          if (primary) timeline.to(primary, { autoAlpha: 1, y: 0, duration: 0.28 }, 0.34);
          if (meta) timeline.to(meta, { autoAlpha: 1, y: 0, duration: 0.28 }, 0.42);
          if (menu) timeline.to(menu, { autoAlpha: 1, y: 0, duration: 0.28 }, 0.34);
          root.classList.remove("header-motion-pending");
          timeline.play(0);
          safetyTimer = setTimeout(finish, 1200);
        } catch { finish(); }
      });
    } catch { finish(); }
  }

  window.siteHeaderEntrance = { start, finish };
  window.addEventListener("pageshow", (event) => { if (event.persisted) finish(); });
  window.addEventListener("load", () => { if (!started) finish(); }, { once: true });
  window.addEventListener("error", (event) => {
    if (/\/(?:script|header-entry)\.js(?:\?|$)/.test(event.filename || "")) finish();
  });
  if (window.siteCriticalScriptFailed) finish();
})();
