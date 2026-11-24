const caseSections = Array.from(document.querySelectorAll("[data-case-section]"));
const caseNavLinks = Array.from(document.querySelectorAll("[data-case-nav]"));
const casePosition = document.querySelector("[data-case-position]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Keep the same scroll range on an untransformed wrapper. The browser can
// update these images independently of JavaScript when revisiting the section.
const nativeStoryMedia = new Set();
if (!prefersReducedMotion
  && window.CSS?.supports("animation-timeline", "view()")
  && window.CSS.supports("animation-range", "entry 0px entry 64vh")) {
  document.querySelectorAll("#website .case-story__media").forEach((media) => {
    const wrapper = document.createElement("div");
    wrapper.className = "case-story__scroll-reveal";
    media.before(wrapper);
    wrapper.append(media);
    nativeStoryMedia.add(media);
  });
}

// Match the reference's scroll-scrubbed fade and subtle scale. On phones,
// gallery cards use this reveal instead of the desktop scroll-flip sequence.
const caseScrollMedia = Array.from(document.querySelectorAll(
  ".case-carousel, .case-wide-visual, .case-story__media, .integration-map, .case-scroll-gallery__card"
)).filter((media) => !nativeStoryMedia.has(media));

if (caseScrollMedia.length && !prefersReducedMotion) {
  let mediaFrame = 0;
  const mediaScales = new WeakMap();
  const clampUnit = (value) => Math.max(0, Math.min(1, value));

  function renderCaseScrollMedia() {
    mediaFrame = 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const revealDistance = Math.max(1, viewportHeight * 0.64);

    const updates = caseScrollMedia.map((media) => {
      if (media.classList.contains("case-scroll-gallery__card") && window.innerWidth > 767) {
        return { media, reset: true };
      }
      const previousScale = mediaScales.get(media) ?? 1;
      // getBoundingClientRect includes the current scale. Recover layout top
      // so the animation never feeds its own transform back into its progress.
      const visualTop = media.getBoundingClientRect().top;
      const layoutTop = visualTop - (1 - previousScale) * media.offsetHeight / 2;
      const progress = clampUnit((viewportHeight - layoutTop) / revealDistance);
      const scale = 0.9 + progress * 0.1;
      return { media, progress, scale };
    });

    updates.forEach(({ media, reset, progress, scale }) => {
      if (reset) {
        media.classList.remove("case-scroll-media");
        media.style.removeProperty("--case-scroll-opacity");
        media.style.removeProperty("--case-scroll-scale");
        mediaScales.delete(media);
        return;
      }
      media.style.setProperty("--case-scroll-opacity", progress.toFixed(4));
      media.style.setProperty("--case-scroll-scale", scale.toFixed(4));
      mediaScales.set(media, scale);
      media.classList.add("case-scroll-media");
    });
  }

  function scheduleCaseScrollMedia() {
    if (!mediaFrame) mediaFrame = window.requestAnimationFrame(renderCaseScrollMedia);
  }

  window.addEventListener("scroll", scheduleCaseScrollMedia, { passive: true });
  window.addEventListener("resize", scheduleCaseScrollMedia, { passive: true });
  window.addEventListener("pageshow", scheduleCaseScrollMedia);
  renderCaseScrollMedia();
}

const scrollGallery = document.querySelector(".case-scroll-gallery");
const scrollGalleryStage = scrollGallery?.querySelector(".case-scroll-gallery__stage");
const scrollGalleryCards = Array.from(scrollGallery?.querySelectorAll(".case-scroll-gallery__card") ?? []);

if (scrollGallery && "IntersectionObserver" in window) {
  const galleryNavObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) setActiveCaseSection("renewal");
  }, { rootMargin: "-24% 0px -56% 0px", threshold: 0 });
  galleryNavObserver.observe(scrollGallery);
}

if (scrollGallery && scrollGalleryStage && scrollGalleryCards.length === 3 && !prefersReducedMotion) {
  let galleryFrame = 0;
  const clampUnit = (value) => Math.max(0, Math.min(1, value));
  const smoothStep = (value) => value * value * (3 - 2 * value);

  function renderScrollGallery() {
    galleryFrame = 0;
    if (window.innerWidth <= 767) {
      scrollGalleryCards[1].style.removeProperty("transform");
      scrollGalleryCards[2].style.removeProperty("transform");
      return;
    }
    const stageTop = Number.parseFloat(window.getComputedStyle(scrollGalleryStage).top) || 0;
    const travel = Math.max(1, scrollGallery.offsetHeight - scrollGalleryStage.offsetHeight);
    const progress = clampUnit((stageTop - scrollGallery.getBoundingClientRect().top) / travel);
    const second = smoothStep(clampUnit((progress - 0.04) / 0.42));
    const third = smoothStep(clampUnit((progress - 0.53) / 0.42));

    scrollGalleryCards[1].style.transform = `translate3d(0, ${(1 - second) * 105}%, 0)`;
    scrollGalleryCards[2].style.transform = `translate3d(0, ${(1 - third) * 105}%, 0)`;
  }

  function scheduleScrollGallery() {
    if (!galleryFrame) galleryFrame = window.requestAnimationFrame(renderScrollGallery);
  }

  window.addEventListener("scroll", scheduleScrollGallery, { passive: true });
  window.addEventListener("resize", scheduleScrollGallery, { passive: true });
  renderScrollGallery();
}

function setActiveCaseSection(id) {
  const activeIndex = caseSections.findIndex((section) => section.id === id);
  if (activeIndex < 0) return;

  caseNavLinks.forEach((link) => {
    const active = link.hash === `#${id}`;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "location");
      const nav = link.closest(".case-nav");
      const links = link.closest(".case-nav__links");
      const navBounds = nav?.getBoundingClientRect();
      if (links && links.scrollWidth > links.clientWidth && navBounds && navBounds.top < window.innerHeight && navBounds.bottom > 0) {
        const linkBounds = link.getBoundingClientRect();
        const linksBounds = links.getBoundingClientRect();
        const target = links.scrollLeft + linkBounds.left - linksBounds.left - (links.clientWidth - linkBounds.width) / 2;
        links.scrollTo({ left: target, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (casePosition) casePosition.textContent = String(activeIndex + 1).padStart(2, "0");
}

if ("IntersectionObserver" in window && caseSections.length) {
  const visibleSections = new Map();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.boundingClientRect.top);
      else visibleSections.delete(entry.target.id);
    });

    const closest = Array.from(visibleSections.entries()).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0];
    if (closest) setActiveCaseSection(closest[0]);
  }, { rootMargin: "-24% 0px -56% 0px", threshold: [0, 0.01, 0.2] });

  caseSections.forEach((section) => sectionObserver.observe(section));
}

caseNavLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveCaseSection(link.hash.slice(1)));
});

const carousel = document.querySelector("[data-case-carousel]");
const carouselTrack = carousel?.querySelector("[data-carousel-track]");
const carouselSlides = Array.from(carousel?.querySelectorAll("[data-carousel-slide]") ?? []);
const carouselViewport = carousel?.querySelector(".case-carousel__viewport");
const carouselSlideDelay = 3500;
const carouselWrapTimers = new WeakMap();
let carouselIndex = 0;
let carouselPointerId = null;
let carouselStartX = 0;
let carouselDeltaX = 0;
let carouselDidDrag = false;
let carouselAutoplayTimer = 0;
let carouselIsVisible = false;
let carouselAnnouncement = null;

if (carousel && carouselSlides.length > 1) {
  carouselAnnouncement = document.createElement("span");
  carouselAnnouncement.className = "sr-only";
  carouselAnnouncement.setAttribute("aria-live", "polite");
  carouselAnnouncement.setAttribute("aria-atomic", "true");
  carousel.append(carouselAnnouncement);
}

function renderCarousel(nextIndex, announce = false) {
  if (!carouselTrack || !carouselSlides.length) return;
  carouselIndex = (nextIndex + carouselSlides.length) % carouselSlides.length;

  carouselSlides.forEach((slide, index) => {
    let position = index - carouselIndex;
    const midpoint = carouselSlides.length / 2;
    if (position > midpoint) position -= carouselSlides.length;
    if (position < -midpoint) position += carouselSlides.length;

    const previousPosition = slide.hasAttribute("data-carousel-position")
      ? Number(slide.dataset.carouselPosition)
      : null;
    const wrapsAround = (previousPosition === -1 && position === 1)
      || (previousPosition === 1 && position === -1);
    window.clearTimeout(carouselWrapTimers.get(slide));
    slide.classList.toggle("is-wrapping", wrapsAround);

    slide.dataset.carouselPosition = String(position);
    slide.setAttribute("aria-hidden", String(position !== 0));

    if (wrapsAround) {
      carouselWrapTimers.set(slide, window.setTimeout(() => {
        slide.classList.remove("is-wrapping");
      }, 360));
    }
  });

  if (announce && carouselAnnouncement) {
    const caption = carouselSlides[carouselIndex].querySelector("figcaption")?.textContent?.trim();
    carouselAnnouncement.textContent = window.siteI18n?.locale === "ru"
      ? `Слайд ${carouselIndex + 1} из ${carouselSlides.length}${caption ? `: ${caption}` : ""}`
      : `Slide ${carouselIndex + 1} of ${carouselSlides.length}${caption ? `: ${caption}` : ""}`;
  }
}

function stopCarouselAutoplay() {
  window.clearTimeout(carouselAutoplayTimer);
  carouselAutoplayTimer = 0;
}

function canAutoplayCarousel() {
  return Boolean(
    carouselSlides.length > 1
    && carouselIsVisible
    && carouselPointerId === null
    && !document.hidden
    && !prefersReducedMotion
  );
}

function scheduleCarouselAutoplay() {
  stopCarouselAutoplay();
  if (!canAutoplayCarousel()) return;

  carouselAutoplayTimer = window.setTimeout(() => {
    renderCarousel(carouselIndex + 1);
    scheduleCarouselAutoplay();
  }, carouselSlideDelay);
}

function moveCarousel(nextIndex) {
  renderCarousel(nextIndex, true);
  scheduleCarouselAutoplay();
}

carouselSlides.forEach((slide) => {
  slide.addEventListener("click", () => {
    if (carouselDidDrag) return;
    const position = Number(slide.dataset.carouselPosition);
    if (position) moveCarousel(carouselIndex + Math.sign(position));
  });
});

carousel?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  moveCarousel(carouselIndex + (event.key === "ArrowRight" ? 1 : -1));
});

carouselViewport?.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || carouselPointerId !== null
    || (event.pointerType === "mouse" && event.button !== 0)) return;
  stopCarouselAutoplay();
  carouselPointerId = event.pointerId;
  carouselStartX = event.clientX;
  carouselDeltaX = 0;
  carouselDidDrag = false;
  carousel?.focus({ preventScroll: true });
});

window.addEventListener("pointermove", (event) => {
  if (event.pointerId !== carouselPointerId) return;
  carouselDeltaX = event.clientX - carouselStartX;
  if (Math.abs(carouselDeltaX) > 8 && !carouselDidDrag) {
    carouselDidDrag = true;
    // Capture only a drag: capturing a simple press retargets the subsequent
    // click to the viewport and prevents the neighbouring slide from receiving it.
    carouselViewport.setPointerCapture(event.pointerId);
  }
});

function finishCarouselPointer(event, cancelled = false) {
  if (carouselPointerId === null || event.pointerId !== carouselPointerId) return;
  const pointerId = carouselPointerId;
  carouselPointerId = null;
  if (carouselViewport.hasPointerCapture(pointerId)) carouselViewport.releasePointerCapture(pointerId);
  if (!cancelled) {
    carouselDeltaX = event.clientX - carouselStartX;
    if (Math.abs(carouselDeltaX) > 8) carouselDidDrag = true;
    if (Math.abs(carouselDeltaX) > 42) moveCarousel(carouselIndex + (carouselDeltaX < 0 ? 1 : -1));
  }
  scheduleCarouselAutoplay();
  window.setTimeout(() => { carouselDidDrag = false; }, 0);
}

window.addEventListener("pointerup", (event) => finishCarouselPointer(event));
window.addEventListener("pointercancel", (event) => finishCarouselPointer(event, true));
carouselViewport?.addEventListener("lostpointercapture", (event) => finishCarouselPointer(event, true));
window.addEventListener("blur", () => finishCarouselPointer({ pointerId: carouselPointerId }, true));
carouselViewport?.addEventListener("dragstart", (event) => event.preventDefault());

renderCarousel(0);

if (carousel && "IntersectionObserver" in window) {
  const carouselObserver = new IntersectionObserver(([entry]) => {
    carouselIsVisible = entry.isIntersecting;
    if (carouselIsVisible) scheduleCarouselAutoplay();
    else stopCarouselAutoplay();
  }, { threshold: 0.35 });

  carouselObserver.observe(carousel);
} else {
  carouselIsVisible = Boolean(carousel);
  scheduleCarouselAutoplay();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopCarouselAutoplay();
  else scheduleCarouselAutoplay();
});

// Keep the next-project thumbnail tied to the destination case's first slide.
const nextProjectLink = document.querySelector(".case-next a[href]");
const nextProjectPreview = nextProjectLink?.querySelector(".case-next__preview img");

if (nextProjectLink && nextProjectPreview) {
  const targetUrl = new URL(nextProjectLink.getAttribute("href"), location.href);
  if (targetUrl.origin === location.origin) {
    fetch(targetUrl, { cache: "no-cache" })
      .then((response) => response.ok ? response.text() : null)
      .then((markup) => {
        if (!markup) return;
        const targetPage = new DOMParser().parseFromString(markup, "text/html");
        const mainImage = targetPage.querySelector("[data-case-carousel] [data-carousel-slide] img");
        const source = window.siteI18n?.locale === "ru"
          ? mainImage?.getAttribute("data-ru-preview-src") || mainImage?.getAttribute("data-preview-src")
            || mainImage?.getAttribute("data-ru-src") || mainImage?.getAttribute("src")
          : mainImage?.getAttribute("data-preview-src") || mainImage?.getAttribute("src");
        if (!source) return;
        const coverUrl = new URL(source, targetUrl).href;
        if (nextProjectPreview.src !== coverUrl) nextProjectPreview.src = coverUrl;
      })
      .catch(() => { /* Keep the matching thumbnail in the page markup. */ });
  }
}

window.addEventListener("pagehide", stopCarouselAutoplay);

const accordionItems = Array.from(document.querySelectorAll("[data-accordion-item]"));

function setAccordionItem(item, shouldOpen, animate = true) {
  const trigger = item.querySelector(".case-accordion__trigger");
  const answer = item.querySelector("[data-accordion-answer]");
  if (!trigger || !answer) return;

  window.clearTimeout(answer.closeTimer);
  answer.animationToken = (answer.animationToken || 0) + 1;
  const animationToken = answer.animationToken;
  const currentHeight = answer.getBoundingClientRect().height;

  trigger.setAttribute("aria-expanded", String(shouldOpen));
  answer.setAttribute("aria-hidden", String(!shouldOpen));
  item.classList.toggle("is-open", shouldOpen);

  if (prefersReducedMotion || !animate) {
    answer.style.height = shouldOpen ? "auto" : "0px";
    answer.style.opacity = shouldOpen ? "1" : "0";
    delete answer.dataset.animating;
    return;
  }

  answer.dataset.animating = "true";
  answer.style.height = `${currentHeight}px`;
  void answer.offsetHeight;

  const targetHeight = shouldOpen ? answer.scrollHeight : 0;
  window.requestAnimationFrame(() => {
    if (answer.animationToken !== animationToken) return;
    answer.style.height = `${targetHeight}px`;
    answer.style.opacity = shouldOpen ? "1" : "0";
  });

  const finishTransition = (event) => {
    if (event.propertyName !== "height") return;
    answer.removeEventListener("transitionend", finishTransition);
    if (answer.animationToken !== animationToken) return;
    answer.style.height = item.classList.contains("is-open") ? "auto" : "0px";
    delete answer.dataset.animating;
  };

  answer.addEventListener("transitionend", finishTransition);
}

accordionItems.forEach((item) => {
  const trigger = item.querySelector(".case-accordion__trigger");
  if (!trigger) return;

  setAccordionItem(item, false, false);
  trigger.addEventListener("click", () => {
    const willOpen = trigger.getAttribute("aria-expanded") !== "true";
    accordionItems.forEach((peer) => setAccordionItem(peer, peer === item && willOpen));
  });
});

// Reserve space for the tallest answer so opening any Context item leaves the image in place.
function reserveContextAccordionSpace() {
  const accordion = document.querySelector(".case-context .case-accordion");
  if (!accordion) return;
  const items = Array.from(accordion.querySelectorAll("[data-accordion-item]"));
  const closedHeight = 1 + items.reduce((height, item) => {
    const trigger = item.querySelector(".case-accordion__trigger");
    return height + (trigger ? trigger.offsetHeight : 0) + 1;
  }, 0);
  const tallestAnswer = Math.max(0, ...items.map((item) => {
    const answer = item.querySelector("[data-accordion-answer]");
    return answer ? answer.scrollHeight : 0;
  }));
  accordion.style.setProperty("--case-accordion-reserved-height", `${Math.ceil(closedHeight + tallestAnswer)}px`);
}

reserveContextAccordionSpace();
window.addEventListener("resize", reserveContextAccordionSpace, { passive: true });
document.fonts?.ready.then(reserveContextAccordionSpace);

window.addEventListener("pageshow", (event) => {
  if (event.persisted) accordionItems.forEach((item) => setAccordionItem(item, false, false));
});

if (window.siteI18n?.locale === "ru" && document.querySelector('.work-areas__canvas [data-work-key="homepage"]')) {
  document.querySelectorAll('.work-areas__canvas [data-work-key="pricing"], .work-areas__canvas [data-work-key="videos"], .work-areas__canvas [data-work-key="waiting"], .work-areas__canvas [data-work-key="landings"]').forEach((chip) => chip.remove());
}

const workChips = Array.from(document.querySelectorAll(".work-chip"));

function selectWorkChip(chip) {
  workChips.forEach((item) => {
    const active = item === chip;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
}

workChips.forEach((chip) => chip.addEventListener("click", () => {
  selectWorkChip(chip);
  if (!window.matchMedia("(max-width: 767px)").matches) return;

  const target = document.getElementById(chip.dataset.workTarget);
  if (!target) return;
  if (window.location.hash !== `#${target.id}`) window.location.hash = target.id;
  else target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}));
if (workChips[0]) selectWorkChip(workChips[0]);

function initWorkAreasPhysics() {
  const surface = document.querySelector("[data-work-areas]");
  const items = surface ? Array.from(surface.querySelectorAll(".work-chip")) : [];
  if (!surface || !items.length || !window.Matter || prefersReducedMotion) return;

  const compactLayout = window.matchMedia("(max-width: 767px)");
  const { Body, Bodies, Collision, Composite, Engine } = window.Matter;
  const engine = Engine.create({ enableSleeping: false, positionIterations: 8, velocityIterations: 6 });
  const states = new Map();
  let frame = 0;
  let previousTime = 0;
  let accumulatedTime = 0;
  let sceneActive = false;
  let topLayer = 20;
  let resizeFrame = 0;

  engine.gravity.y = 1;
  engine.gravity.scale = 0.00145;

  const renderState = (item, state) => {
    if (!state.body) return;
    const { width, height } = state.body.plugin.workChipSize;
    item.style.setProperty("--work-x", `${state.body.position.x - width / 2}px`);
    item.style.setProperty("--work-y", `${state.body.position.y - height / 2}px`);
    item.style.setProperty("--work-rotate", `${state.body.angle}rad`);
  };

  const buildWorld = (preserve = false) => {
    const width = surface.clientWidth;
    const height = surface.clientHeight;
    const usableHeight = height;
    const sideInset = compactLayout.matches ? 12 : 0;
    const verticalInset = compactLayout.matches ? 12 : 0;
    const oldStates = items.map((item) => {
      const body = states.get(item)?.body;
      return body
        ? {
            x: body.position.x / Math.max(1, width),
            y: body.position.y / Math.max(1, usableHeight),
            angle: body.angle,
            velocity: { ...body.velocity },
            angularVelocity: body.angularVelocity,
          }
        : null;
    });

    Composite.clear(engine.world, false);
    const wallDepth = 120;
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, usableHeight - verticalInset + wallDepth / 2, width + wallDepth * 2, wallDepth, { isStatic: true }),
      Bodies.rectangle(sideInset - wallDepth / 2, usableHeight / 2, wallDepth, usableHeight + wallDepth * 2, { isStatic: true }),
      Bodies.rectangle(width - sideInset + wallDepth / 2, usableHeight / 2, wallDepth, usableHeight + wallDepth * 2, { isStatic: true }),
      Bodies.rectangle(width / 2, verticalInset - wallDepth / 2, width + wallDepth * 2, wallDepth, { isStatic: true }),
    ]);

    items.forEach((item, index) => {
      const state = states.get(item);
      const old = oldStates[index];
      const style = getComputedStyle(item);
      const desktopSpawnX = [0.03, 0.25, 0.5, 0.76, 0.1, 0.36, 0.7, 0.02, 0.27, 0.54, 0.78, 0.08, 0.34, 0.61, 0.8];
      const compact = compactLayout.matches;
      const compactSpawnX = [0.02, 0.5, 0.98];
      const xRatio = compact ? compactSpawnX[index % compactSpawnX.length] : desktopSpawnX[index] ?? index / items.length;
      const spawnRow = compact ? Math.floor(index / compactSpawnX.length) : index % 5;
      const halfWidth = item.offsetWidth / 2;
      const halfHeight = item.offsetHeight / 2;
      const body = Bodies.rectangle(
        preserve && old
          ? Math.min(width - sideInset - halfWidth, Math.max(sideInset + halfWidth, old.x * width))
          : sideInset + halfWidth + Math.max(0, width - item.offsetWidth - sideInset * 2) * xRatio,
        preserve && old
          ? Math.min(usableHeight - halfHeight, Math.max(halfHeight, old.y * usableHeight))
          : 40 + halfHeight + spawnRow * (compact ? 76 : 74),
        item.offsetWidth,
        item.offsetHeight,
        {
          angle: preserve && old ? old.angle : (Number.parseFloat(style.getPropertyValue("--r")) * Math.PI) / 180 || 0,
          chamfer: { radius: item.offsetHeight / 2 },
          density: 0.0012,
          friction: 0.42,
          frictionStatic: 0.72,
          frictionAir: 0.012,
          restitution: 0.24,
        },
      );
      body.plugin.workChipSize = { width: item.offsetWidth, height: item.offsetHeight };
      state.body = body;
      if (preserve && old) {
        Body.setVelocity(body, old.velocity);
        Body.setAngularVelocity(body, old.angularVelocity);
      } else {
        Body.setVelocity(body, { x: index % 2 ? -0.7 : 0.7, y: index * 0.08 });
        Body.setAngularVelocity(body, (index % 2 ? -1 : 1) * 0.006);
      }
      Composite.add(engine.world, body);
      Body.setPosition(body, clampBodyToSurface(body, body.position.x, body.position.y));
      renderState(item, state);
    });
  };

  const tick = (time) => {
    if (!sceneActive) {
      frame = 0;
      return;
    }
    const fixedStep = 1000 / 60;
    const delta = previousTime ? Math.min(50, time - previousTime) : fixedStep;
    previousTime = time;
    accumulatedTime += delta;
    while (accumulatedTime >= fixedStep) {
      items.forEach((item) => {
        const state = states.get(item);
        if (state.pointerId === null || !state.body || !state.dragTarget) return;
        const body = state.body;
        state.dragStartX = body.position.x;
        state.dragStartY = body.position.y;
        const target = clampBodyToSurface(body, state.dragTarget.x, state.dragTarget.y);
        const dx = (target.x - body.position.x) * 0.32;
        const dy = (target.y - body.position.y) * 0.32;
        const speed = Math.hypot(dx, dy);
        const scale = speed > 9 ? 9 / speed : 1;
        moveWithContact(body, body.position.x + dx * scale, body.position.y + dy * scale);
        Body.setVelocity(body, { x: 0, y: 0 });
      });
      Engine.update(engine, fixedStep);
      items.forEach((item) => {
        const state = states.get(item);
        const body = state?.body;
        if (!body) return;
        if (state.pointerId !== null && state.dragTarget) {
          const movedX = body.position.x - state.dragStartX;
          const movedY = body.position.y - state.dragStartY;
          if (Math.hypot(movedX, movedY) > 0.1) {
            state.throwX = movedX;
            state.throwY = movedY;
            state.lastMotionTime = time;
          }
        }
        // The mobile walls keep moving chips inside. Repositioning them here
        // compresses the pile against the floor and makes it jitter/overlap.
        if (body.isStatic || compactLayout.matches) return;
        const target = clampBodyToSurface(body, body.position.x, body.position.y);
        if (Math.abs(target.x - body.position.x) < 0.01 && Math.abs(target.y - body.position.y) < 0.01) return;
        const velocity = { ...body.velocity };
        if (target.x !== body.position.x) velocity.x = 0;
        if (target.y !== body.position.y) velocity.y = 0;
        Body.setPosition(body, target);
        Body.setVelocity(body, velocity);
      });
      accumulatedTime -= fixedStep;
    }
    items.forEach((item) => renderState(item, states.get(item)));
    frame = window.requestAnimationFrame(tick);
  };

  const startScene = () => {
    if (frame) return;
    sceneActive = true;
    previousTime = 0;
    accumulatedTime = 0;
    frame = window.requestAnimationFrame(tick);
  };

  const stopScene = () => {
    sceneActive = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const clampBodyToSurface = (body, x, y) => {
    const sideInset = compactLayout.matches ? 12 : 0;
    const verticalInset = compactLayout.matches ? 12 : 0;
    const { width, height } = body.plugin.workChipSize;
    // CSS draws a true capsule; Matter's chamfered rectangle is slightly smaller
    // at diagonal angles, so its bounds alone can still clip the visible chip.
    const radius = height / 2;
    const straightHalfLength = Math.max(0, (width - height) / 2);
    const halfX = radius + Math.abs(Math.cos(body.angle)) * straightHalfLength;
    const halfY = radius + Math.abs(Math.sin(body.angle)) * straightHalfLength;
    const minX = sideInset + halfX;
    const maxX = surface.clientWidth - sideInset - halfX;
    const minY = verticalInset + halfY;
    const maxY = surface.clientHeight - verticalInset - halfY;
    return {
      x: minX <= maxX ? Math.min(maxX, Math.max(minX, x)) : surface.clientWidth / 2,
      y: minY <= maxY ? Math.min(maxY, Math.max(minY, y)) : surface.clientHeight / 2,
    };
  };

  // Let the dragged chip press gently against its neighbours so they can move,
  // while limiting penetration before Matter resolves each contact.
  const moveWithContact = (body, targetX, targetY) => {
    const startX = body.position.x;
    const startY = body.position.y;
    const distance = Math.hypot(targetX - startX, targetY - startY);
    if (distance < 0.01) return;
    const others = items.map((item) => states.get(item).body).filter((other) => other && other !== body);
    const initialDepths = others.map((other) => Collision.collides(body, other)?.depth || 0);
    const steps = Math.ceil(distance / 2);
    let x = startX;
    let y = startY;
    for (let step = 1; step <= steps; step += 1) {
      const nextX = startX + ((targetX - startX) * step) / steps;
      const nextY = startY + ((targetY - startY) * step) / steps;
      Body.setPosition(body, { x: nextX, y: nextY });
      if (others.some((other, index) => (Collision.collides(body, other)?.depth || 0) > Math.max(8, initialDepths[index]) + 0.01)) {
        Body.setPosition(body, { x, y });
        return;
      }
      x = nextX;
      y = nextY;
    }
  };

  items.forEach((item) => {
    const state = {
      body: null,
      pointerId: null,
      dragTarget: null,
      pointerOffsetX: 0,
      pointerOffsetY: 0,
      previousX: 0,
      previousY: 0,
      previousTime: 0,
      lastMotionTime: 0,
      dragStartX: 0,
      dragStartY: 0,
      throwX: 0,
      throwY: 0,
      dragDistance: 0,
      suppressClick: false,
    };
    states.set(item, state);

    item.addEventListener("click", (event) => {
      if (!state.suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      state.suppressClick = false;
    }, true);

    item.addEventListener("pointerdown", (event) => {
      if (!state.body || (event.pointerType === "mouse" && event.button !== 0)) return;
      if (event.pointerType === "mouse") event.preventDefault();
      const surfaceRect = surface.getBoundingClientRect();
      state.pointerId = event.pointerId;
      state.pointerOffsetX = event.clientX - surfaceRect.left - state.body.position.x;
      state.pointerOffsetY = event.clientY - surfaceRect.top - state.body.position.y;
      state.previousX = event.clientX;
      state.previousY = event.clientY;
      state.previousTime = performance.now();
      state.lastMotionTime = 0;
      state.throwX = 0;
      state.throwY = 0;
      state.dragDistance = 0;
      state.suppressClick = false;
      state.dragTarget = { ...state.body.position };
      Body.setVelocity(state.body, { x: 0, y: 0 });
      Body.setStatic(state.body, true);
      topLayer += 1;
      item.style.zIndex = String(topLayer);
      item.classList.add("is-dragging");
      item.setPointerCapture(event.pointerId);
      startScene();
    });

    item.addEventListener("pointermove", (event) => {
      if (!state.body || state.pointerId !== event.pointerId) return;
      const surfaceRect = surface.getBoundingClientRect();
      const target = clampBodyToSurface(
        state.body,
        event.clientX - surfaceRect.left - state.pointerOffsetX,
        event.clientY - surfaceRect.top - state.pointerOffsetY,
      );
      const moveX = event.clientX - state.previousX;
      const moveY = event.clientY - state.previousY;
      state.dragDistance += Math.hypot(moveX, moveY);
      state.dragTarget = target;
      const startX = state.body.position.x;
      const startY = state.body.position.y;
      moveWithContact(state.body, target.x, target.y);
      const now = performance.now();
      const elapsed = Math.max(8, now - state.previousTime);
      const movedX = state.body.position.x - startX;
      const movedY = state.body.position.y - startY;
      if (Math.hypot(movedX, movedY) > 0.1) {
        state.throwX = Math.max(-9, Math.min(9, movedX * (1000 / 60) / elapsed));
        state.throwY = Math.max(-9, Math.min(9, movedY * (1000 / 60) / elapsed));
        state.lastMotionTime = now;
      }
      state.previousX = event.clientX;
      state.previousY = event.clientY;
      state.previousTime = now;
      renderState(item, state);
      startScene();
    });

    const release = (event) => {
      if (!state.body || state.pointerId !== event.pointerId) return;
      state.pointerId = null;
      state.dragTarget = null;
      state.suppressClick = state.dragDistance > 6;
      item.classList.remove("is-dragging");
      if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
      Body.setPosition(state.body, clampBodyToSurface(state.body, state.body.position.x, state.body.position.y));
      Body.setStatic(state.body, false);
      const hasRecentMotion = performance.now() - state.lastMotionTime < 100;
      Body.setVelocity(state.body, {
        x: hasRecentMotion ? Math.max(-9, Math.min(9, state.throwX)) : 0,
        y: hasRecentMotion ? Math.max(-9, Math.min(9, state.throwY)) : 0,
      });
      startScene();
    };

    item.addEventListener("pointerup", release);
    item.addEventListener("pointercancel", release);
    item.addEventListener("lostpointercapture", release);
    window.addEventListener("blur", () => {
      if (state.pointerId !== null) release({ pointerId: state.pointerId });
    });
    item.addEventListener("keydown", (event) => {
      if (!state.body) return;
      const step = event.shiftKey ? 32 : 12;
      const movement = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }[event.key];
      if (!movement) return;
      event.preventDefault();
      const target = clampBodyToSurface(state.body, state.body.position.x + movement[0], state.body.position.y + movement[1]);
      Body.setVelocity(state.body, {
        x: (target.x - state.body.position.x) * 0.2,
        y: (target.y - state.body.position.y) * 0.2,
      });
      topLayer += 1;
      item.style.zIndex = String(topLayer);
      renderState(item, state);
      startScene();
    });
  });

  const syncPhysicsLayout = () => {
    const wasReady = surface.classList.contains("is-physics-ready");
    surface.classList.add("is-physics-ready");
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => buildWorld(wasReady));
  };

  compactLayout.addEventListener("change", syncPhysicsLayout);
  syncPhysicsLayout();
  const resizeObserver = new ResizeObserver(() => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => buildWorld(true));
  });
  resizeObserver.observe(surface);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) startScene();
    else stopScene();
  }, { threshold: 0.08 });
  visibilityObserver.observe(surface);
  window.addEventListener("pagehide", stopScene, { once: true });
}

initFeatureWhenNear("[data-work-areas]", ["vendor/matter.min.js"], initWorkAreasPhysics, "#work-areas");

const metricScrambles = Array.from(document.querySelectorAll("[data-text-scramble]"));
const caseTextRevealMargin = "0px 0px -30% 0px";

function caseRevealCleanup(elements, properties = "transform,opacity,visibility") {
  const targets = Array.from(elements);
  if (!targets[0]?.closest("#website, .case-role")) return { clearProps: properties };
  const styleProperties = properties.split(",");
  // GSAP's transform clearProps reparses computed geometry after each letter.
  // Remove the completed styles together without synchronous layout reads.
  return {
    onComplete() {
      targets.forEach((element) => {
        styleProperties.forEach((property) => element.style.removeProperty(property));
        const cache = window.gsap.core.getCache(element);
        cache.uncache = 1;
      });
    },
  };
}

function playMetricScramble(element, delay = 0) {
  const finalText = element.textContent ?? "";
  const duration = 720;
  const glyphs = "0123456789";

  window.setTimeout(() => {
    const startedAt = performance.now();

    function render(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const revealed = Math.floor(progress * (finalText.length + 1));

      element.textContent = Array.from(finalText, (character, index) => {
        if (!/\d/.test(character) || index < revealed) return character;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join("");

      if (progress < 1) window.requestAnimationFrame(render);
      else element.textContent = finalText;
    }

    window.requestAnimationFrame(render);
  }, delay);
}

function initMetricScrambleInView() {
  if (prefersReducedMotion || !("IntersectionObserver" in window) || !metricScrambles.length) return;

  const metricObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      playMetricScramble(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: caseTextRevealMargin, threshold: 0.01 });

  metricScrambles.forEach((metric) => metricObserver.observe(metric));
}

function initCaseTextMotion() {
  if (prefersReducedMotion || !window.gsap || !("IntersectionObserver" in window)) return;

  const sectionMotion = [
    { selector: "#overview", title: "h1", support: [".case-hero__lede", ".case-meta"] },
    { selector: "#context", title: "h2", support: [".case-context__intro > p:last-child", ".case-accordion"] },
    { selector: "#work-areas", title: "h2", support: [".work-areas__canvas"] },
    { selector: "#website", title: "h2", support: [".case-story__copy > p", ".case-story__notes"] },
    { selector: "#in-app", title: "h2", support: [".case-story__copy > p", ".case-story__notes"] },
    { selector: "#upgrades", title: "h2", support: [".case-story__copy > p", ".case-story__notes"] },
    { selector: "#renewal", title: "h2", support: [".case-story__copy > p:last-child", ".renewal-flow"] },
    { selector: "#impact", title: "h2", support: [".case-impact__intro > p:last-child", ".case-impact__metrics"] },
  ];

  function splitTitle(title) {
    const text = title.textContent.trim();
    const visual = document.createElement("span");

    visual.setAttribute("aria-hidden", "true");
    title.setAttribute("aria-label", text);

    // Keep nonbreaking spaces inside a word so selected phrases stay together.
    text.split(/[\t\n\r\f ]+/).forEach((word, wordIndex, words) => {
      const parts = title.id === "case-title" && document.body.classList.contains("eme-page")
        && document.body.dataset.locale === "ru" && word === "дизайн-система."
        ? ["дизайн-", "система."] : [word];

      parts.forEach((part) => {
        const wordElement = document.createElement("span");
        wordElement.className = "case-motion-word";

        Array.from(part).forEach((character) => {
          const characterElement = document.createElement("span");
          characterElement.className = "case-motion-char";
          characterElement.textContent = character;
          wordElement.append(characterElement);
        });

        visual.append(wordElement);
      });
      if (wordIndex < words.length - 1) visual.append(" ");
    });

    title.textContent = "";
    title.classList.add("case-motion-title");
    title.append(visual);
    return Array.from(title.querySelectorAll(".case-motion-char"));
  }

  const preparedElements = new Map();
  const titleMotion = (characters) => ({
    autoAlpha: 1,
    rotateX: 0,
    y: 0,
    duration: 0.2,
    stagger: 0.035,
    ease: "power3.out",
    ...caseRevealCleanup(characters),
  });

  function prepareStoryHeading(characters) {
    if (!Element.prototype.animate || !window.CSS?.supports("animation-timing-function", "linear(0, 1)")) return null;
    // Sample the existing GSAP curve so compositor playback keeps the same
    // rotation, fade, duration and letter offsets without per-frame JS writes.
    const ease = window.gsap.parseEase("power3.out");
    const easing = `linear(${Array.from({ length: 201 }, (_, index) => ease(index / 200).toFixed(8)).join(",")})`;
    const animations = characters.map((character, index) => {
      character.style.willChange = "transform, opacity";
      const animation = character.animate([
        { opacity: 0, transform: "translateY(10px) rotateX(90deg)" },
        { opacity: 1, transform: "translateY(0px) rotateX(0deg)" },
      ], { duration: 200, delay: index * 35, easing, fill: "both" });
      animation.pause();
      animation.currentTime = 0;
      return animation;
    });
    Promise.all(animations.map((animation) => animation.finished)).then(() => {
      caseRevealCleanup(characters).onComplete();
      characters.forEach((character) => character.style.removeProperty("will-change"));
      animations.forEach((animation) => animation.cancel());
    }).catch(() => { /* Navigation can cancel unfinished browser animations. */ });
    return {
      play() {
        const startTime = document.timeline.currentTime;
        characters.forEach((character) => { character.style.visibility = "visible"; });
        animations.forEach((animation) => {
          animation.play();
          animation.startTime = startTime;
        });
      },
    };
  }

  sectionMotion.forEach((config) => {
    const section = document.querySelector(config.selector);
    const title = section?.querySelector(config.title);
    if (!section || !title) return;

    const characters = splitTitle(title);
    const supportingElements = [...new Set(config.support.flatMap((selector) => Array.from(section.querySelectorAll(selector))))];

    window.gsap.set(characters, { autoAlpha: 0, rotateX: 90, y: 10 });
    window.gsap.set(supportingElements, { autoAlpha: 0, y: 10 });

    if (config.selector === "#overview") {
      // The metadata sits at the bottom of the hero, often below the fold.
      // Reveal the whole hero copy together when any part of it enters view.
      preparedElements.set(section.querySelector(".case-hero__copy") || title, {
        characters,
        supportingElements,
      });
    } else {
      const warm = config.selector === "#website";
      const animation = warm ? prepareStoryHeading(characters) || window.gsap.to(characters, {
        ...titleMotion(characters), paused: true, immediateRender: true, lazy: false,
      }) : null;
      preparedElements.set(title, { characters, animation });
      supportingElements.forEach((element) => {
        const animation = warm ? window.gsap.timeline({ paused: true }).to(element, {
          autoAlpha: 1, y: 0, duration: 0.28, delay: 0.04, ease: "power3.out",
          ...caseRevealCleanup([element]),
          immediateRender: true, lazy: false,
        }) : null;
        preparedElements.set(element, { element, animation });
      });
    }
  });

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const prepared = preparedElements.get(entry.target);
      if (!prepared) return;

      if (prepared.characters) {
        if (prepared.animation) prepared.animation.play();
        else window.gsap.to(prepared.characters, titleMotion(prepared.characters));
        prepared.supportingElements?.forEach((element) => {
          const isHeroMeta = element.matches(".case-meta");
          window.gsap.to(element, {
            autoAlpha: 1,
            y: 0,
            duration: isHeroMeta ? 0.32 : 0.28,
            delay: isHeroMeta ? 2.2 : 0.04,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility",
          });
        });
      } else {
        const isWorkAreasCanvas = prepared.element.matches(".work-areas__canvas");
        if (prepared.animation) prepared.animation.play();
        else window.gsap.to(prepared.element, {
          autoAlpha: 1,
          y: 0,
          duration: isWorkAreasCanvas ? 0.9 : 0.28,
          delay: 0.04,
          ease: isWorkAreasCanvas ? "sine.inOut" : "power3.out",
          ...caseRevealCleanup([prepared.element]),
        });
      }

      activeObserver.unobserve(entry.target);
    });
  }, { rootMargin: caseTextRevealMargin, threshold: 0.01 });

  preparedElements.forEach((_, element) => observer.observe(element));
}

function initDecisionTextEffects() {
  if (prefersReducedMotion || !window.gsap || !("IntersectionObserver" in window)) return;

  const preparedBlocks = Array.from(document.querySelectorAll(".case-decision")).map((block) => {
    const label = block.querySelector(":scope > span");
    const paragraph = block.querySelector(":scope > p");
    if (!label || !paragraph) return null;

    const text = paragraph.textContent.trim();
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");

    text.split(/[\t\n\r\f ]+/).forEach((word, wordIndex, words) => {
      const wordElement = document.createElement("span");
      wordElement.className = "case-motion-word";

      Array.from(word).forEach((character) => {
        const characterElement = document.createElement("span");
        characterElement.className = "case-motion-char";
        characterElement.textContent = character;
        wordElement.append(characterElement);
      });

      visual.append(wordElement);
      if (wordIndex < words.length - 1) visual.append(" ");
    });

    paragraph.textContent = "";
    const accessible = document.createElement("span");
    accessible.className = "sr-only";
    accessible.textContent = text;
    paragraph.classList.add("case-decision__text-effect");
    paragraph.append(accessible);
    paragraph.append(visual);

    const characters = Array.from(paragraph.querySelectorAll(".case-motion-char"));
    window.gsap.set(label, { autoAlpha: 0, y: 8, filter: "blur(8px)" });
    window.gsap.set(characters, { autoAlpha: 0, rotateX: 90, y: 10 });

    return { block, label, characters };
  }).filter(Boolean);

  const revealDecisionText = (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const prepared = preparedBlocks.find((item) => item.block === entry.target);
      if (!prepared) return;

      const stagger = Math.min(0.05, 2.4 / Math.max(1, prepared.characters.length));

      window.gsap.to(prepared.label, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power3.out",
        ...caseRevealCleanup([prepared.label], "transform,opacity,visibility,filter"),
      });

      window.gsap.to(prepared.characters, {
        autoAlpha: 1,
        rotateX: 0,
        y: 0,
        duration: 0.2,
        delay: 0.5,
        stagger,
        ease: "power3.out",
        ...caseRevealCleanup(prepared.characters),
      });

      observer.unobserve(entry.target);
    });
  };

  const observer = new IntersectionObserver(revealDecisionText, {
    rootMargin: caseTextRevealMargin, threshold: 0.01,
  });

  preparedBlocks.forEach(({ block }) => observer.observe(block));
}

function initNextProjectTextEffect() {
  if (prefersReducedMotion || !window.gsap || !("IntersectionObserver" in window)) return;

  const block = document.querySelector(".case-next");
  const label = block?.querySelector(":scope > p");
  const textElements = block ? Array.from(block.querySelectorAll(":scope > a > .case-next__title")) : [];
  if (!block || !label || !textElements.length) return;

  const characters = textElements.flatMap((element) => {
    const text = element.textContent.trim();
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");

    text.split(/[\t\n\r\f ]+/).forEach((word, wordIndex, words) => {
      const wordElement = document.createElement("span");
      wordElement.className = "case-motion-word";

      Array.from(word).forEach((character) => {
        const characterElement = document.createElement("span");
        characterElement.className = "case-motion-char";
        characterElement.textContent = character;
        wordElement.append(characterElement);
      });

      visual.append(wordElement);
      if (wordIndex < words.length - 1) visual.append(" ");
    });

    element.textContent = "";
    const accessible = document.createElement("span");
    accessible.className = "sr-only";
    accessible.textContent = text;
    element.classList.add("case-next__text-effect");
    element.append(accessible);
    element.append(visual);
    return Array.from(element.querySelectorAll(".case-motion-char"));
  });

  window.gsap.set(label, { autoAlpha: 0, y: 8, filter: "blur(8px)" });
  window.gsap.set(characters, { autoAlpha: 0, rotateX: 90, y: 10 });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      window.gsap.to(label, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility,filter",
      });

      window.gsap.to(characters, {
        autoAlpha: 1,
        rotateX: 0,
        y: 0,
        duration: 0.2,
        delay: 0.5,
        stagger: 0.05,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
      });

      observer.unobserve(entry.target);
    });
  }, { rootMargin: caseTextRevealMargin, threshold: 0.01 });

  observer.observe(label);
}

initCaseTextMotion();
initMetricScrambleInView();
initDecisionTextEffects();
initNextProjectTextEffect();


const revealItems = Array.from(document.querySelectorAll("[data-case-reveal]"));
if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: caseTextRevealMargin, threshold: 0.01 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

document.documentElement.classList.remove("case-motion-pending");
