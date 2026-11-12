(function () {
  const page = location.pathname.split("/").pop()?.replace(/\.html$/, "") || "index";
  const params = new URLSearchParams(location.search);
  const requested = params.get("lang");
  let saved = "en";
  try { saved = localStorage.getItem("portfolio-language") || "en"; } catch { /* Storage can be disabled. */ }
  let locale = requested === "ru" || requested === "en" ? requested : saved === "ru" ? "ru" : "en";
  const sourceScripts = page === "index"
    ? ["gsap-starter.js", "script.js?v=20261112-dialog-cursor-reset"]
    : ["script.js?v=20261111-case-first-reveal", "amocrm.js?v=20261112-carousel-five-seconds"];
  let messages = {};

  window.siteI18n = {
    locale,
    t(source) { return messages[source] || source; },
  };

  function localeUrl(language) {
    const url = new URL(location.href);
    if (language === "ru") url.searchParams.set("lang", "ru");
    else url.searchParams.delete("lang");
    return url;
  }

  function setLanguage(language) {
    if (language === locale) return;
    try { localStorage.setItem("portfolio-language", language); } catch { /* Keep URL-based selection. */ }
    location.assign(localeUrl(language).href);
  }

  function updateLanguageMenu() {
    document.querySelectorAll("[data-language-menu]").forEach((menu) => {
      const trigger = menu.querySelector(".language-menu__trigger");
      const desktopLabel = trigger?.querySelector(".language-menu__label");
      const mobileLabel = trigger?.querySelector(":scope > span:not(.language-menu__label)");
      if (desktopLabel) desktopLabel.textContent = locale.toUpperCase();
      if (mobileLabel) mobileLabel.textContent = locale === "ru" ? "Русский" : "English";
      trigger?.setAttribute("aria-label", locale === "ru" ? "Язык: русский" : "Language: English");
      menu.querySelectorAll(".language-menu__options button").forEach((button) => {
        const language = button.textContent.trim().startsWith("Русский") ? "ru" : "en";
        button.setAttribute("aria-pressed", String(language === locale));
        button.addEventListener("click", () => setLanguage(language));
      });
    });
  }

  function rewriteInternalLink(link) {
    const raw = link.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || link.hasAttribute("download")) return;
    const url = new URL(raw, location.href);
    if (url.origin !== location.origin || !(/\/$/.test(url.pathname) || /\.html$/.test(url.pathname))) return;
    if (locale === "ru") url.searchParams.set("lang", "ru");
    else url.searchParams.delete("lang");
    link.href = url.pathname + url.search + url.hash;
  }

  function keepLanguageInNavigation() {
    document.querySelectorAll("a[href]").forEach(rewriteInternalLink);
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.("a[href]");
      if (link) rewriteInternalLink(link);
    }, true);
  }

  function translateNode(node) {
    if (node.parentElement?.closest("script, style, noscript, svg, template")) return;
    const match = node.textContent.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return;
    const key = match[2].replace(/\s+/g, " ").trim();
    if (key && Object.hasOwn(messages, key)) node.textContent = match[1] + messages[key] + match[3];
  }

  function translatePage(catalog) {
    messages = { ...(catalog.common || {}), ...(catalog.pages?.[page] || {}) };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateNode);
    document.querySelectorAll("[data-i18n-key]").forEach((element) => {
      const translation = messages[element.dataset.i18nKey];
      if (translation) element.textContent = translation;
    });
    if (locale === "ru") {
      document.querySelectorAll("[data-ru-src]").forEach((element) => {
        element.setAttribute("src", element.dataset.ruSrc);
      });
    }
    document.querySelectorAll("[alt], [aria-label], [title], [placeholder]").forEach((element) => {
      ["alt", "aria-label", "title", "placeholder"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value && Object.hasOwn(messages, value)) element.setAttribute(attribute, messages[value]);
      });
    });
    if (locale === "ru") {
      document.querySelectorAll('[lang="en"]').forEach((element) => { element.lang = "ru"; });
    }

    document.documentElement.lang = locale;
    document.body.dataset.locale = locale;
    const meta = catalog.meta?.[page];
    if (meta?.title) document.title = meta.title;
    if (meta?.description) document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);

    const baseUrl = new URL(location.pathname, location.origin);
    const localizedUrl = new URL(baseUrl.href);
    localizedUrl.searchParams.set("lang", "ru");
    [["canonical", locale === "ru" ? localizedUrl.href : baseUrl.href],
      ["alternate", baseUrl.href, "en"],
      ["alternate", localizedUrl.href, "ru"]].forEach(([rel, href, hreflang]) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      if (hreflang) link.hreflang = hreflang;
      document.head.append(link);
    });
  }

  function loadScript(source) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = source;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.append(script);
    });
  }

  async function start() {
    try {
      const response = await fetch(`locales/${locale}.json`);
      if (!response.ok) throw new Error(`Locale ${locale} could not be loaded`);
      translatePage(await response.json());
    } catch (error) {
      console.error("Portfolio localization:", error);
      locale = "en";
      window.siteI18n.locale = "en";
      document.documentElement.lang = "en";
    }
    try { localStorage.setItem("portfolio-language", locale); } catch { /* URL still preserves the choice. */ }
    try {
      updateLanguageMenu();
      keepLanguageInNavigation();
    } finally {
      document.documentElement.classList.remove("locale-pending");
    }
    for (const source of sourceScripts) await loadScript(source);
    document.documentElement.classList.remove("case-motion-pending");
  }

  start();
})();
