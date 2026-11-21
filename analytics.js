(() => {
  "use strict";
  if (window.__portfolioAnalyticsConsent) return;
  window.__portfolioAnalyticsConsent = true;

  const measurementId = "G-F8D3RDCWBJ";
  const metrikaId = 114438806;
  const metrikaProvider = "yandex-metrika";
  const consentKey = "portfolio-analytics-consent-v1";
  const languageKey = "portfolio-analytics-language-transition-v1";
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  const disableKey = `ga-disable-${measurementId}`;
  const cases = new Set(["amocrm", "eme-web", "eme-app", "don-ballon", "shable", "eme"]);
  let consent = readConsent();
  let started = false;
  let metrikaStarted = false;
  let stopCaseEngagement;
  let coveredPage = false;
  let expiryTimer;
  let panel;
  let settings;

  function readConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(consentKey));
      if (value && ["granted", "denied"].includes(value.choice)
        && Number.isFinite(value.time) && value.time <= Date.now()
        && Date.now() - value.time < maxAge) return value;
    } catch { /* A blocked store never implies consent. */ }
    return null;
  }

  function granted() {
    return consent?.choice === "granted" && Date.now() - consent.time < maxAge;
  }

  function metrikaGranted() {
    return granted() && Array.isArray(consent.providers) && consent.providers.includes(metrikaProvider);
  }

  function needsMetrikaConsent() {
    return granted() && !metrikaGranted();
  }

  function locale() {
    const requested = new URLSearchParams(location.search).get("lang");
    if (["ru", "en"].includes(requested)) return requested;
    if (window.siteI18n?.locale) return window.siteI18n.locale;
    if (document.querySelector('script[src*="i18n.js"]')) {
      try { return localStorage.getItem("portfolio-language") === "ru" ? "ru" : "en"; } catch { return "en"; }
    }
    return document.documentElement.lang.startsWith("ru") ? "ru" : "en";
  }

  function pagePath() {
    return location.pathname.replace(/\/index\.html$/, "/");
  }

  function cleanUrl(value) {
    try {
      const url = new URL(value, location.href);
      return `${url.origin}${url.pathname}`;
    } catch { return ""; }
  }

  function clearAnalyticsCookies() {
    const names = ["_ga", `_ga_${measurementId.slice(2)}`,
      ...document.cookie.split(";").map((cookie) => cookie.trim().split("=")[0]).filter((name) => name.startsWith("_ym"))];
    const domains = location.hostname.split(".");
    for (const name of names) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      for (let index = 0; index < domains.length - 1; index += 1) {
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domains.slice(index).join(".")}; SameSite=Lax`;
      }
    }
    try {
      Object.keys(localStorage).filter((key) => key.startsWith("_ym")).forEach((key) => localStorage.removeItem(key));
    } catch { /* Browser storage may be blocked. */ }
  }

  function consumeLanguageTransition() {
    try {
      const transition = JSON.parse(sessionStorage.getItem(languageKey));
      sessionStorage.removeItem(languageKey);
      return transition?.path === pagePath() && transition.to === locale()
        && transition.from !== transition.to && Date.now() - transition.time >= 0
        && Date.now() - transition.time < 30000;
    } catch { return false; }
  }

  // Basic consent mode: do not even request gtag.js until consent is granted.
  function startGoogleAnalytics(suppressPageView = false) {
    if (!granted() || started) return;
    started = true;
    coveredPage = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "denied", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied",
    });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    const config = {
      send_page_view: !suppressPageView,
      page_location: `${location.origin}${pagePath()}`,
      page_referrer: document.referrer ? cleanUrl(document.referrer) : "",
      site_language: locale(),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: location.hostname,
      cookie_expires: maxAge / 1000,
      cookie_flags: location.protocol === "https:" ? "SameSite=Lax;Secure" : "SameSite=Lax",
    };
    if (new URLSearchParams(location.search).get("ga_debug") === "1") config.debug_mode = true;
    window.gtag("config", measurementId, config);
    const script = document.createElement("script");
    script.async = true;
    script.id = "portfolio-google-tag";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  }

  function startMetrika(suppressPageView = false) {
    if (!metrikaGranted() || metrikaStarted) return;
    metrikaStarted = true;
    // Official asynchronous Metrica loader, invoked only after consent.
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      if (Array.from(e.scripts).some((script) => script.src.split("?")[0] === r)) return;
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.id = "portfolio-metrika-tag";
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(metrikaId, "init", {
      webvisor: false,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      trackHash: false,
      ecommerce: false,
      disableYtm: true,
      defer: suppressPageView,
      url: `${location.origin}${pagePath()}`,
      referer: document.referrer ? cleanUrl(document.referrer) : "",
    });
    startCaseEngagement();
  }

  function startAnalytics(suppressPageView = false) {
    startGoogleAnalytics(suppressPageView);
    startMetrika(suppressPageView);
  }

  function reachGoal(name) {
    if (metrikaGranted() && metrikaStarted && typeof window.ym === "function") {
      window.ym(metrikaId, "reachGoal", name);
    }
  }

  function startCaseEngagement() {
    const caseName = location.pathname.split("/").pop().replace(/\.html$/, "");
    if (!["amocrm", "eme-web", "eme-app", "don-ballon", "shable"].includes(caseName)) return;
    let elapsed = 0;
    let activeSince = null;
    let maxDepth = 0;
    let sent = false;
    let timer;
    let scrollFrame;
    let suspended = false;
    const active = () => !suspended && !document.hidden && document.hasFocus() && metrikaGranted();

    function stop() {
      clearTimeout(timer);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", update);
      activeSince = null;
    }

    function update() {
      clearTimeout(timer);
      const now = performance.now();
      if (activeSince !== null) elapsed += Math.max(0, now - activeSince);
      activeSince = active() ? now : null;
      if (sent || !metrikaGranted()) return;
      if (activeSince !== null && maxDepth < 0.6) {
        const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        maxDepth = Math.max(maxDepth, Math.min(1, (window.scrollY + window.innerHeight) / Math.max(1, height)));
      }
      if (activeSince !== null && elapsed >= 30000 && maxDepth >= 0.6) {
        sent = true;
        stop();
        reachGoal("case_engaged");
      } else if (activeSince !== null && elapsed < 30000) {
        timer = setTimeout(update, Math.max(1, 30000 - elapsed));
      }
    }

    function onScroll() {
      if (sent || maxDepth >= 0.6 || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; update(); });
    }
    function onHide() { suspended = true; update(); }
    function onShow() { suspended = false; update(); }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", update);
    stopCaseEngagement = stop;
    update();
  }

  function stopAnalytics() {
    window[disableKey] = true;
    stopCaseEngagement?.();
    if (metrikaStarted && typeof window.ym === "function") window.ym(metrikaId, "destruct");
    clearAnalyticsCookies();
    document.getElementById("portfolio-google-tag")?.remove();
    document.getElementById("portfolio-metrika-tag")?.remove();
    // Reload unloads Google's automatic listeners as well as our own events.
    // No consent-update ping is sent after consent has been withdrawn.
    if (started || metrikaStarted) location.reload();
  }

  function setChoice(choice) {
    consent = { choice, time: Date.now(), providers: ["google-analytics", metrikaProvider] };
    try { localStorage.setItem(consentKey, JSON.stringify(consent)); } catch { /* Remember in this document only. */ }
    showPanel(false);
    scheduleExpiry();
    if (choice === "granted") startAnalytics();
    else stopAnalytics();
  }

  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    if (!consent) return;
    expiryTimer = setTimeout(() => {
      if (!consent) return;
      if (Date.now() - consent.time >= maxAge) {
        consent = null;
        showPanel(true);
        stopAnalytics();
      } else scheduleExpiry();
    }, Math.min(Math.max(1, maxAge - (Date.now() - consent.time)), 86400000));
  }

  const messages = {
    ru: {
      title: "Аналитические cookie",
      text: "Google Analytics и Яндекс Метрика помогают понять, какие страницы интересны посетителям. Сервисы включаются только с вашего согласия. Выбор можно изменить в любое время.",
      accept: "Принять", reject: "Отклонить", settings: "Настройки cookie",
      granted: "Сейчас аналитика разрешена.", denied: "Сейчас аналитика отключена.",
      upgrade: "Ранее вы разрешили Google Analytics. Для подключения Яндекс Метрики нужно ваше согласие.",
    },
    en: {
      title: "Analytics cookies",
      text: "Google Analytics and Yandex Metrica help me understand which pages visitors find useful. These services start only with your consent. You can change your choice at any time.",
      accept: "Accept", reject: "Decline", settings: "Cookie settings",
      granted: "Analytics is currently allowed.", denied: "Analytics is currently off.",
      upgrade: "You previously allowed Google Analytics. Adding Yandex Metrica requires your consent.",
    },
  };

  function updateText() {
    const text = messages[locale()];
    panel.lang = locale();
    panel.querySelector("h2").textContent = text.title;
    panel.querySelector("p").textContent = text.text;
    const status = panel.querySelector("[data-consent-status]");
    status.textContent = needsMetrikaConsent() ? text.upgrade : consent ? text[consent.choice] : "";
    status.hidden = !consent;
    panel.querySelector('[data-consent-choice="granted"]').textContent = text.accept;
    panel.querySelector('[data-consent-choice="denied"]').textContent = text.reject;
    settings.textContent = text.settings;
    settings.lang = locale();
  }

  function showPanel(open, focus = false) {
    panel.hidden = !open;
    settings.setAttribute("aria-expanded", String(open));
    updateText();
    if (focus && open) panel.querySelector("h2").focus();
    else if (!open && panel.contains(document.activeElement)) settings.focus({ preventScroll: true });
  }

  function mount() {
    panel = document.createElement("section");
    panel.className = "analytics-consent";
    panel.id = "analytics-consent";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", "analytics-consent-title");
    panel.innerHTML = '<h2 id="analytics-consent-title" tabindex="-1"></h2><p></p><p class="analytics-consent__status" data-consent-status></p><div class="analytics-consent__actions"><button type="button" data-consent-choice="granted"></button><button type="button" data-consent-choice="denied"></button></div>';
    settings = document.createElement("button");
    settings.type = "button";
    settings.className = "analytics-settings";
    settings.setAttribute("aria-controls", panel.id);
    settings.addEventListener("click", () => showPanel(panel.hidden, true));
    panel.querySelectorAll("[data-consent-choice]").forEach((button) => {
      button.addEventListener("click", () => setChoice(button.dataset.consentChoice));
    });
    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); showPanel(false); }
    });
    document.body.append(panel, settings);
    showPanel(!consent || needsMetrikaConsent());
    scheduleExpiry();
    new MutationObserver(updateText).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    const languageTransition = consumeLanguageTransition();
    if (granted()) startAnalytics(languageTransition);
    else stopAnalytics();
  }

  document.addEventListener("click", (event) => {
    const languageButton = event.target.closest?.(".language-menu__options button");
    if (languageButton && granted() && coveredPage) {
      const to = languageButton.textContent.trim().startsWith("Русский") ? "ru" : "en";
      if (to !== locale()) {
        try {
          sessionStorage.setItem(languageKey, JSON.stringify({ path: pagePath(), from: locale(), to, time: Date.now() }));
        } catch { /* Config still sends at most one view per document. */ }
      }
    }
    if (!granted() || !started || event.defaultPrevented || event.button !== 0) return;
    const link = event.target.closest?.("a[href]");
    if (!link) return;
    const destination = new URL(link.href, location.href);
    const caseName = destination.pathname.split("/").pop().replace(/\.html$/, "");
    if (destination.origin === location.origin && cases.has(caseName)
      && destination.pathname !== location.pathname) {
      window.gtag("event", "case_navigation", {
        case_name: caseName, link_url: cleanUrl(destination.href),
        site_language: locale(), transport_type: "beacon",
      });
    }
  }, true);

  document.addEventListener("portfolio:contact-form-success", (event) => {
    if (event.target.matches?.("[data-contact-form]")) reachGoal("contact_form_success");
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== consentKey) return;
    consent = readConsent();
    if (!panel) return;
    showPanel(!consent || needsMetrikaConsent());
    scheduleExpiry();
    if (granted()) startAnalytics();
    else stopAnalytics();
  });
  document.addEventListener("visibilitychange", () => {
    if (panel && !document.hidden && consent && Date.now() - consent.time >= maxAge) {
      clearTimeout(expiryTimer);
      consent = null;
      showPanel(true);
      stopAnalytics();
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
