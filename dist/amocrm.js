const caseSections = Array.from(document.querySelectorAll("[data-case-section]"));
const caseNavLinks = Array.from(document.querySelectorAll("[data-case-nav]"));
const casePosition = document.querySelector("[data-case-position]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setActiveCaseSection(id) {
  const activeIndex = caseSections.findIndex((section) => section.id === id);
  if (activeIndex < 0) return;

  caseNavLinks.forEach((link) => {
    const active = link.hash === `#${id}`;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "location");
      const navBounds = link.closest(".case-nav")?.getBoundingClientRect();
      if (navBounds && navBounds.top < window.innerHeight && navBounds.bottom > 0) {
        link.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
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
const carouselCurrent = carousel?.querySelector("[data-carousel-current]");
const carouselViewport = carousel?.querySelector(".case-carousel__viewport");
const carouselAutoplayDelay = 4000;
let carouselIndex = 0;
let carouselPointerId = null;
let carouselStartX = 0;
let carouselDeltaX = 0;
let carouselDidDrag = false;
let carouselAutoplayTimer = 0;
let carouselIsVisible = false;
let carouselIsHovered = false;
let carouselHasFocus = false;

function renderCarousel(nextIndex) {
  if (!carouselTrack || !carouselSlides.length) return;
  carouselIndex = (nextIndex + carouselSlides.length) % carouselSlides.length;
  if (carouselCurrent) carouselCurrent.textContent = String(carouselIndex + 1).padStart(2, "0");

  carouselSlides.forEach((slide, index) => {
    let position = index - carouselIndex;
    const midpoint = carouselSlides.length / 2;
    if (position > midpoint) position -= carouselSlides.length;
    if (position < -midpoint) position += carouselSlides.length;

    slide.dataset.carouselPosition = String(position);
    slide.setAttribute("aria-hidden", String(position !== 0));
  });
}

function stopCarouselAutoplay() {
  window.clearTimeout(carouselAutoplayTimer);
  carouselAutoplayTimer = 0;
}

function canAutoplayCarousel() {
  return Boolean(
    carouselSlides.length > 1
    && carouselIsVisible
    && !carouselIsHovered
    && !carouselHasFocus
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
  }, carouselAutoplayDelay);
}

function moveCarousel(nextIndex) {
  renderCarousel(nextIndex);
  scheduleCarouselAutoplay();
}

carousel?.querySelector("[data-carousel-prev]")?.addEventListener("click", () => moveCarousel(carouselIndex - 1));
carousel?.querySelector("[data-carousel-next]")?.addEventListener("click", () => moveCarousel(carouselIndex + 1));

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

carousel?.addEventListener("mouseenter", () => {
  carouselIsHovered = true;
  stopCarouselAutoplay();
});

carousel?.addEventListener("mouseleave", () => {
  carouselIsHovered = false;
  scheduleCarouselAutoplay();
});

carousel?.addEventListener("focusin", () => {
  carouselHasFocus = true;
  stopCarouselAutoplay();
});

carousel?.addEventListener("focusout", (event) => {
  if (carousel?.contains(event.relatedTarget)) return;
  carouselHasFocus = false;
  scheduleCarouselAutoplay();
});

carouselViewport?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  stopCarouselAutoplay();
  carouselPointerId = event.pointerId;
  carouselStartX = event.clientX;
  carouselDeltaX = 0;
  carouselDidDrag = false;
  carouselViewport.setPointerCapture(event.pointerId);
});

carouselViewport?.addEventListener("pointermove", (event) => {
  if (event.pointerId !== carouselPointerId) return;
  carouselDeltaX = event.clientX - carouselStartX;
  if (Math.abs(carouselDeltaX) > 8) carouselDidDrag = true;
});

carouselViewport?.addEventListener("pointerup", (event) => {
  if (event.pointerId !== carouselPointerId) return;
  carouselViewport.releasePointerCapture(event.pointerId);
  if (Math.abs(carouselDeltaX) > 42) renderCarousel(carouselIndex + (carouselDeltaX < 0 ? 1 : -1));
  carouselPointerId = null;
  scheduleCarouselAutoplay();
  window.setTimeout(() => { carouselDidDrag = false; }, 0);
});

carouselViewport?.addEventListener("pointercancel", () => {
  carouselPointerId = null;
  carouselDidDrag = false;
  scheduleCarouselAutoplay();
});

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

  setAccordionItem(item, item.classList.contains("is-open"), false);
  trigger.addEventListener("click", () => {
    const willOpen = trigger.getAttribute("aria-expanded") !== "true";
    accordionItems.forEach((peer) => setAccordionItem(peer, peer === item && willOpen));
  });
});

const workCopy = {
  marketing: "Homepage structure, product framing, and feature discovery.",
  navigation: "A clearer product map for finding features and use cases.",
  "ai-page": "A focused page that makes the AI offer easier to understand.",
  pricing: "Plan comparison and pricing information with clearer hierarchy.",
  landings: "In-product pages that introduce features in context.",
  integrations: "Integration pages that explain value and setup.",
  upgrades: "Plan comparison, AI plan, and feature-led upgrade paths.",
  trial: "A clearer end-of-trial state with the next action in view.",
  renewal: "Clear progress feedback while a request is processing.",
  system: "Reusable components and release-quality review.",
};

const workChips = Array.from(document.querySelectorAll("[data-work-target]"));
const workIndex = document.querySelector("[data-work-index]");
const workDescription = document.querySelector("[data-work-description]");
const workLink = document.querySelector("[data-work-link]");

function selectWorkChip(chip) {
  const index = workChips.indexOf(chip);
  const target = chip.dataset.workTarget;
  const key = chip.dataset.workKey;
  workChips.forEach((item) => {
    const active = item === chip;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  if (workIndex) workIndex.textContent = `${String(index + 1).padStart(2, "0")} / ${String(workChips.length).padStart(2, "0")}`;
  if (workDescription) workDescription.textContent = workCopy[key] ?? "";
  if (workLink) workLink.href = `#${target}`;
}

workChips.forEach((chip) => chip.addEventListener("click", () => selectWorkChip(chip)));
if (workChips[0]) selectWorkChip(workChips[0]);

function initWorkAreasPhysics() {
  const surface = document.querySelector("[data-work-areas]");
  const items = surface ? Array.from(surface.querySelectorAll(".work-chip")) : [];
  if (!surface || !items.length || !window.Matter || prefersReducedMotion) return;

  const { Body, Bodies, Composite, Engine, Sleeping } = window.Matter;
  const engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 6 });
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
    item.style.setProperty("--work-x", `${state.body.position.x - item.offsetWidth / 2}px`);
    item.style.setProperty("--work-y", `${state.body.position.y - item.offsetHeight / 2}px`);
    item.style.setProperty("--work-rotate", `${state.body.angle}rad`);
  };

  const buildWorld = (preserve = false) => {
    const width = surface.clientWidth;
    const height = surface.clientHeight;
    const selection = surface.querySelector(".work-areas__selection");
    const usableHeight = Math.max(260, height - (selection?.offsetHeight || 0) - 34);
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
      Bodies.rectangle(width / 2, usableHeight + wallDepth / 2, width + wallDepth * 2, wallDepth, { isStatic: true }),
      Bodies.rectangle(-wallDepth / 2, usableHeight / 2, wallDepth, usableHeight + wallDepth * 2, { isStatic: true }),
      Bodies.rectangle(width + wallDepth / 2, usableHeight / 2, wallDepth, usableHeight + wallDepth * 2, { isStatic: true }),
      Bodies.rectangle(width / 2, -wallDepth / 2, width + wallDepth * 2, wallDepth, { isStatic: true }),
    ]);

    items.forEach((item, index) => {
      const state = states.get(item);
      const old = oldStates[index];
      const style = getComputedStyle(item);
      const desktopSpawnX = [0.04, 0.31, 0.65, 0.16, 0.48, 0.74, 0.03, 0.36, 0.67, 0.27];
      const compact = width < 600;
      const xRatio = compact ? (index % 2 ? 0.98 : 0.02) : desktopSpawnX[index] ?? index / items.length;
      const spawnRow = compact ? Math.floor(index / 2) : index % 4;
      const halfWidth = item.offsetWidth / 2;
      const halfHeight = item.offsetHeight / 2;
      const body = Bodies.rectangle(
        preserve && old
          ? Math.min(width - halfWidth, Math.max(halfWidth, old.x * width))
          : halfWidth + Math.max(0, width - item.offsetWidth) * xRatio,
        preserve && old
          ? Math.min(usableHeight - halfHeight, Math.max(halfHeight, old.y * usableHeight))
          : 48 + halfHeight + spawnRow * (compact ? 82 : 88),
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
          sleepThreshold: 42,
        },
      );
      state.body = body;
      if (preserve && old) {
        Body.setVelocity(body, old.velocity);
        Body.setAngularVelocity(body, old.angularVelocity);
      } else {
        Body.setVelocity(body, { x: index % 2 ? -0.7 : 0.7, y: index * 0.08 });
        Body.setAngularVelocity(body, (index % 2 ? -1 : 1) * 0.006);
      }
      Composite.add(engine.world, body);
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
      Engine.update(engine, fixedStep);
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

  surface.classList.add("is-physics-ready");
  items.forEach((item) => {
    const state = {
      body: null,
      pointerId: null,
      pointerOffsetX: 0,
      pointerOffsetY: 0,
      previousX: 0,
      previousY: 0,
      previousTime: 0,
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
      event.preventDefault();
      const surfaceRect = surface.getBoundingClientRect();
      state.pointerId = event.pointerId;
      state.pointerOffsetX = event.clientX - surfaceRect.left - state.body.position.x;
      state.pointerOffsetY = event.clientY - surfaceRect.top - state.body.position.y;
      state.previousX = event.clientX;
      state.previousY = event.clientY;
      state.previousTime = performance.now();
      state.throwX = 0;
      state.throwY = 0;
      state.dragDistance = 0;
      state.suppressClick = false;
      Sleeping.set(state.body, false);
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
      const halfWidth = item.offsetWidth / 2;
      const halfHeight = item.offsetHeight / 2;
      const footerHeight = surface.querySelector(".work-areas__selection")?.offsetHeight || 0;
      const maxY = surface.clientHeight - footerHeight - 34 - halfHeight;
      const x = Math.min(surface.clientWidth - halfWidth, Math.max(halfWidth, event.clientX - surfaceRect.left - state.pointerOffsetX));
      const y = Math.min(maxY, Math.max(halfHeight, event.clientY - surfaceRect.top - state.pointerOffsetY));
      const now = performance.now();
      const delta = Math.max(8, now - state.previousTime);
      const moveX = event.clientX - state.previousX;
      const moveY = event.clientY - state.previousY;
      state.dragDistance += Math.hypot(moveX, moveY);
      state.throwX = (moveX / delta) * (1000 / 60);
      state.throwY = (moveY / delta) * (1000 / 60);
      state.previousX = event.clientX;
      state.previousY = event.clientY;
      state.previousTime = now;
      Body.setPosition(state.body, { x, y });
      renderState(item, state);
    });

    const release = (event) => {
      if (!state.body || state.pointerId !== event.pointerId) return;
      state.pointerId = null;
      state.suppressClick = state.dragDistance > 6;
      item.classList.remove("is-dragging");
      if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
      Body.setStatic(state.body, false);
      Sleeping.set(state.body, false);
      Body.setVelocity(state.body, {
        x: Math.max(-22, Math.min(22, state.throwX)),
        y: Math.max(-22, Math.min(22, state.throwY)),
      });
      Body.setAngularVelocity(state.body, Math.max(-0.12, Math.min(0.12, state.throwX * 0.006)));
      startScene();
    };

    item.addEventListener("pointerup", release);
    item.addEventListener("pointercancel", release);
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
      const halfWidth = item.offsetWidth / 2;
      const halfHeight = item.offsetHeight / 2;
      const footerHeight = surface.querySelector(".work-areas__selection")?.offsetHeight || 0;
      const maxY = surface.clientHeight - footerHeight - 34 - halfHeight;
      Body.setPosition(state.body, {
        x: Math.min(surface.clientWidth - halfWidth, Math.max(halfWidth, state.body.position.x + movement[0])),
        y: Math.min(maxY, Math.max(halfHeight, state.body.position.y + movement[1])),
      });
      Body.setVelocity(state.body, { x: movement[0] * 0.12, y: movement[1] * 0.12 });
      Sleeping.set(state.body, false);
      topLayer += 1;
      item.style.zIndex = String(topLayer);
      renderState(item, state);
      startScene();
    });
  });

  window.requestAnimationFrame(() => buildWorld(false));
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

initWorkAreasPhysics();

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
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
  revealItems.forEach((item) => revealObserver.observe(item));
}
