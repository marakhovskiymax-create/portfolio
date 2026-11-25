/* WavePhysicsLoader and DotsRing adapted from Amicro (MIT).
 * Copyright (c) 2026 SYED SUBHAN UDDIN. See vendor/amicro-LICENSE.txt.
 * https://github.com/Subhan-code/Amicro--Micro-transitions-
 */
(() => {
  "use strict";
  if (window.siteLoading) return;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const busyButtons = new WeakMap();
  let overlay;
  let bodyObserver;
  let preparation;
  let finished = false;
  const animations = [];

  function language() {
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested === "ru" || requested === "en") return requested;
    try { return localStorage.getItem("portfolio-language") === "ru" ? "ru" : "en"; }
    catch { return document.documentElement.lang === "ru" ? "ru" : "en"; }
  }

  function startWave(bars, ball) {
    if (reducedMotion || typeof ball.animate !== "function") return;
    const frames = bars.map(() => []);
    const ballFrames = [];
    // Preserve the original 201 samples, 15 bars, four bounces and four-second loop.
    for (let k = 0; k <= 200; k += 1) {
      const t = k / 200;
      const fraction = t < 0.5 ? t / 0.5 : (1 - t) / 0.5;
      const ballIndex = fraction * 14;
      const bounceFraction = fraction === 0 || fraction === 1 ? 0 : (fraction * 4) % 1;
      const bounce = 4 * bounceFraction * (1 - bounceFraction);
      const contact = Math.max(0, 1 - bounce * 2);
      const ballY = 16 + 48 - contact * 20 + bounce * 60;
      ballFrames.push({ offset: t,
        transform: `translate(${ballIndex * 20}px, -${ballY}px) scale(${1 + contact * 0.25}, ${1 - contact * 0.3})`,
      });
      frames.forEach((values, index) => {
        const distance = Math.abs(index - ballIndex);
        const wave = distance < 3 ? Math.cos(distance / 3 * Math.PI / 2) : 0;
        const indent = distance < 1.5 ? Math.cos(distance / 1.5 * Math.PI / 2) * contact * 20 : 0;
        const rg = Math.round(39 + wave * (228 - 39));
        const b = Math.round(42 + wave * (231 - 42));
        values.push({ offset: t, height: `${Math.max(4, 16 + wave * 48 - indent)}px`, backgroundColor: `rgb(${rg}, ${rg}, ${b})` });
      });
    }
    const timing = { duration: 4000, iterations: Infinity, easing: "linear" };
    bars.forEach((bar, index) => animations.push(bar.animate(frames[index], timing)));
    animations.push(ball.animate(ballFrames, timing));
  }

  function mount() {
    if (finished || overlay || !document.body) return;
    bodyObserver?.disconnect();
    overlay = document.createElement("div");
    overlay.className = "page-loader";
    overlay.setAttribute("data-page-loader", "");
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    const wave = document.createElement("div");
    wave.className = "page-loader__wave";
    wave.setAttribute("aria-hidden", "true");
    const bars = Array.from({ length: 15 }, () => {
      const bar = document.createElement("span");
      bar.className = "page-loader__bar";
      wave.append(bar);
      return bar;
    });
    const ball = document.createElement("span");
    ball.className = "page-loader__ball";
    wave.append(ball);
    const label = document.createElement("span");
    label.className = "loader-accessible-label";
    label.lang = language();
    label.textContent = language() === "ru" ? "Страница загружается" : "Loading page";
    overlay.append(wave, label);
    document.body.prepend(overlay);
    startWave(bars, ball);
  }

  function finish(recover = false) {
    // Recovery must also work if a later app initializer fails after reveal.
    if (recover) root.classList.remove("locale-pending", "page-motion-pending", "hero-motion-pending", "case-motion-pending");
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    bodyObserver?.disconnect();
    animations.forEach((animation) => animation.cancel());
    overlay?.remove();
    root.classList.remove("page-loading");
    root.removeAttribute("aria-busy");
  }

  function imageReady(image) {
    image.loading = "eager";
    const decoded = () => typeof image.decode === "function" ? image.decode().catch(() => {}) : Promise.resolve();
    if (image.complete) return decoded();
    return new Promise((resolve) => {
      const settle = () => {
        image.removeEventListener("load", settle);
        image.removeEventListener("error", settle);
        decoded().then(resolve);
      };
      image.addEventListener("load", settle, { once: true });
      image.addEventListener("error", settle, { once: true });
      if (image.complete) settle();
    });
  }

  function preloadScript(source) {
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "script";
      link.href = source;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.append(link);
    });
  }

  function prepare(sources = []) {
    if (preparation) return preparation;
    const firstCover = document.querySelector("[data-case-carousel] [data-carousel-slide] img");
    const images = Array.from(document.images).filter((image) => {
      const bounds = image.getBoundingClientRect();
      return image === firstCover || bounds.width > 0 && bounds.height > 0 && bounds.top < window.innerHeight && bounds.bottom > 0;
    });
    preparation = new Promise((resolve) => {
      const deadline = setTimeout(resolve, 6500);
      Promise.allSettled([
        document.fonts?.ready,
        ...images.map(imageReady),
        ...sources.map(preloadScript),
      ]).then(() => { clearTimeout(deadline); resolve(); });
    });
    return preparation;
  }

  function setButtonBusy(button, busy, label) {
    if (!button) return;
    let state = busyButtons.get(button);
    if (busy && !state) {
      state = { width: button.style.width, label: button.getAttribute("aria-label"), busy: button.getAttribute("aria-busy") };
      busyButtons.set(button, state);
      button.style.width = `${button.getBoundingClientRect().width}px`;
      button.setAttribute("data-loading-button", "");
      if (!button.querySelector(".button-dots-ring")) {
        const ring = document.createElement("span");
        ring.className = "button-dots-ring";
        ring.setAttribute("aria-hidden", "true");
        ring.innerHTML = '<svg viewBox="0 0 48 48" focusable="false">' + Array.from({ length: 8 }, (_, index) =>
          `<g transform="rotate(${index * 45} 24 24)"><circle class="button-dots-ring__dot" cx="24" cy="4" r="4" style="animation-delay:${index * 0.15}s" /></g>`).join("") + '</svg>';
        button.append(ring);
      }
    }
    if (busy) {
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-label", label || (language() === "ru" ? "Отправка…" : "Sending…"));
    } else if (state) {
      button.style.width = state.width;
      if (state.label === null) button.removeAttribute("aria-label");
      else button.setAttribute("aria-label", state.label);
      if (state.busy === null) button.removeAttribute("aria-busy");
      else button.setAttribute("aria-busy", state.busy);
      busyButtons.delete(button);
    }
  }

  window.siteLoading = { prepare, finish, setButtonBusy, get active() { return !finished; } };
  root.classList.add("page-loading");
  root.setAttribute("aria-busy", "true");
  const watchdog = setTimeout(() => finish(true), 8000);
  if (document.body) mount();
  else {
    bodyObserver = new MutationObserver(mount);
    bodyObserver.observe(root, { childList: true });
  }
  document.addEventListener("DOMContentLoaded", () => {
    mount();
    // Standalone video/utility pages do not use the shared localization bootstrap.
    if (!document.querySelector('script[src*="i18n.js"]')) prepare().finally(() => finish());
  }, { once: true });
  document.addEventListener("error", (event) => {
    if (event.target?.tagName === "SCRIPT" && event.target.src.includes("i18n.js")) prepare().finally(() => finish(true));
  }, true);
  window.addEventListener("error", (event) => { if (event.error) finish(true); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) finish(true); });
})();
