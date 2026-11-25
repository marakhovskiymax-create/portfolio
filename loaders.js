/* DotsRing adapted from Amicro (MIT).
 * Copyright (c) 2026 SYED SUBHAN UDDIN. See vendor/amicro-LICENSE.txt.
 * https://github.com/Subhan-code/Amicro--Micro-transitions-
 */
(() => {
  "use strict";
  if (window.siteLoading) return;
  const busyButtons = new WeakMap();

  function language() {
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested === "ru" || requested === "en") return requested;
    try { return localStorage.getItem("portfolio-language") === "ru" ? "ru" : "en"; }
    catch { return document.documentElement.lang === "ru" ? "ru" : "en"; }
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

  window.siteLoading = { setButtonBusy };
})();
