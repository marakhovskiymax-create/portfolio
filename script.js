const projectContent = {
  "eme-web": {
    caption: "Интерактивный предпросмотр проекта EME.WEB, экосистемы грузоперевозок.",
  },
  "eme-app": {
    caption: "Интерактивный предпросмотр проекта EME.APP, приложения для работы на складе.",
  },
  "lunch-balloon": {
    caption: "Интерактивный предпросмотр проекта Ланч Баллон, магазина воздушных шаров.",
  },
  "match-tv": {
    caption: "Интерактивный предпросмотр продуктовых сценариев и интерфейсов Матч ТВ.",
  },
  "don-ballon": {
    caption: "Интерактивный предпросмотр e-commerce проекта Дон Баллон и полного пути покупки.",
  },
};

const visual = document.querySelector("[data-project-visual]");
const visualCaption = visual?.querySelector("[data-visual-caption]");
const stageCards = Array.from(visual?.querySelectorAll("[data-stage-card]") ?? []);
const timeMachineStops = Array.from(visual?.querySelectorAll("[data-stage-index]") ?? []);
const timeMachineTimeline = visual?.querySelector(".time-machine__timeline");
const reduceTimeMachineMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function syncTimeMachine(activeIndex, immediate = false) {
  stageCards.forEach((card, index) => {
    const offset = index - activeIndex;
    const hasPassed = offset < 0;
    const properties = {
      "--card-z": hasPassed ? "200px" : `${-offset * 60}px`,
      "--card-y": hasPassed ? "300px" : `${-offset * 12}px`,
      "--card-rotate": hasPassed ? "-20deg" : `${offset * 2}deg`,
      "--card-scale": hasPassed ? 1.3 : 1,
      "--card-opacity": hasPassed ? 0 : 1 - Math.abs(offset) * 0.2,
    };

    card.classList.toggle("is-current", offset === 0);
    card.style.zIndex = String(stageCards.length - index);

    if (window.gsap && !reduceTimeMachineMotion && !immediate) {
      window.gsap.to(card, {
        ...properties,
        duration: 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
    } else {
      Object.entries(properties).forEach(([property, value]) => card.style.setProperty(property, String(value)));
    }
  });

  timeMachineStops.forEach((stop) => {
    if (!stop.classList.contains("time-machine__stop--main")) return;
    const isActive = Number(stop.dataset.stageIndex) === activeIndex;
    stop.classList.toggle("is-active", isActive);
    stop.setAttribute("aria-pressed", String(isActive));
  });
}

function syncTimeMachineHover(hoveredIndex = null) {
  visual?.classList.toggle("is-scrubbing", hoveredIndex !== null);

  timeMachineStops.forEach((stop) => {
    const stopIndex = Number(stop.dataset.stageIndex);
    const isMain = stop.classList.contains("time-machine__stop--main");
    const isSelected = Math.round(stopIndex) === Math.round(hoveredIndex ?? -10);
    const isNear = hoveredIndex !== null && Math.abs(stopIndex - hoveredIndex) <= 0.5;
    const scale = hoveredIndex === null ? 1 : isMain && isSelected ? 1.4 : isNear ? (isMain ? 1.25 : 1.15) : 1;
    const opacity = isMain ? 1 : hoveredIndex === null ? 0.3 : isNear ? 0.5 : 0.3;

    stop.classList.toggle("is-hovered", hoveredIndex !== null && stopIndex === hoveredIndex);
    stop.style.setProperty("--stop-scale", String(scale));
    stop.style.setProperty("--stop-opacity", String(opacity));
  });
}

function activateProject(index) {
  const card = stageCards[index];
  const projectId = card?.dataset.stageCard;
  const project = projectContent[projectId];
  if (!project || !visual) return;

  visual.dataset.projectVisual = projectId;
  visualCaption.textContent = project.caption;
  syncTimeMachine(index);
}

timeMachineStops.forEach((stop) => {
  const stopIndex = Number(stop.dataset.stageIndex);
  const activate = () => activateProject(Math.round(stopIndex));
  stop.addEventListener("click", activate);
  stop.addEventListener("pointerenter", () => {
    syncTimeMachineHover(stopIndex);
    activate();
  });
  stop.addEventListener("focus", () => {
    syncTimeMachineHover(stopIndex);
    activate();
  });
  stop.addEventListener("keydown", (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = timeMachineStops.indexOf(stop);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? timeMachineStops.length - 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + timeMachineStops.length) % timeMachineStops.length;
    timeMachineStops[next].focus();
  });
});

timeMachineTimeline?.addEventListener("pointerleave", () => syncTimeMachineHover());
timeMachineTimeline?.addEventListener("focusout", () => {
  window.requestAnimationFrame(() => {
    if (!timeMachineTimeline.contains(document.activeElement)) syncTimeMachineHover();
  });
});

syncTimeMachine(0, true);
syncTimeMachineHover();

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");

function closeMenu() {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.setAttribute("aria-expanded", "false");
  mobileMenu.hidden = true;
}

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  mobileMenu.hidden = open;
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function initSpiderCursor() {
  const canvas = document.querySelector("[data-spider-cursor]");
  const canTrackPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canvas || !canTrackPointer || reduceMotion) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const { sin, cos, PI, hypot, min, max, sqrt } = Math;
  const many = (count, factory) => Array.from({ length: count }, (_, index) => factory(index));
  const random = (range = 1, offset = 0) => Math.random() * range + offset;
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const clamp = (value, lower = 0, upper = 1) => max(lower, min(value, upper));
  const smoothstep = (value) => {
    const progress = clamp(value);
    return progress * progress * (3 - 2 * progress);
  };
  const wrap = (value, limit) => ((value % limit) + limit) % limit;
  const point = (x, y) => ({ x, y });
  const noise = (x, y, seed = 101) => {
    const first = sin(0.3 * x + 1.4 * seed + 2 + 2.5 * sin(0.4 * y - 1.3 * seed + 1));
    const second = sin(0.2 * y + 1.5 * seed + 2.8 + 2.3 * sin(0.5 * x - 1.2 * seed + 0.5));
    return first + second;
  };

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let activeTarget = null;
  let lastTargetRect = null;
  let targetProgress = 0;
  let previousTimestamp = 0;
  let frame = 0;
  let targetRadiusCache = new WeakMap();
  const interactiveSelector = "a, button, [role='button'], input:not([type='hidden']), select, textarea, [data-cursor-target]";

  function resolveInteractiveTarget(element) {
    const interactive = element instanceof Element ? element.closest(interactiveSelector) : null;
    if (!interactive || interactive.matches(":disabled, [aria-disabled='true']")) return null;
    if (interactive.matches(".career-tab")) return interactive.querySelector(".career-tab__logo");
    if (interactive.matches(".time-machine__stop")) return interactive.querySelector(".time-machine__stop-target");
    return interactive;
  }

  function syncCanvas() {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    const nextRatio = min(window.devicePixelRatio || 1, 2);
    if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;

    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    targetRadiusCache = new WeakMap();
  }

  function drawCircle(x, y, radius) {
    context.beginPath();
    context.ellipse(x, y, radius, radius, 0, 0, PI * 2);
    context.fill();
  }

  function drawThread(startX, startY, endX, endY) {
    context.beginPath();
    context.moveTo(startX, startY);
    for (let index = 0; index < 100; index += 1) {
      const progress = (index + 1) / 100;
      const x = lerp(startX, endX, progress);
      const y = lerp(startY, endY, progress);
      const offset = noise(x / 5 + startX, y / 5 + startY) * 2;
      context.lineTo(x + offset, y + offset);
    }
    context.stroke();
  }

  function quarterEllipseLength(radiusX, radiusY) {
    if (!radiusX || !radiusY) return 0;
    const sum = radiusX + radiusY;
    const h = ((radiusX - radiusY) ** 2) / (sum ** 2);
    return (PI * sum * (1 + (3 * h) / (10 + sqrt(4 - 3 * h)))) / 4;
  }

  function perimeterPoint(rect, progress) {
    let distance = ((progress % 1) + 1) % 1 * rect.perimeter;

    for (const segment of rect.segments) {
      if (distance <= segment.length || segment === rect.segments.at(-1)) {
        const amount = segment.length ? min(1, distance / segment.length) : 0;
        if (segment.type === "line") {
          return point(
            lerp(segment.startX, segment.endX, amount),
            lerp(segment.startY, segment.endY, amount),
          );
        }

        const angle = lerp(segment.startAngle, segment.endAngle, amount);
        return point(
          segment.centerX + cos(angle) * segment.radiusX,
          segment.centerY + sin(angle) * segment.radiusY,
        );
      }
      distance -= segment.length;
    }

    return point(rect.left, rect.top);
  }

  function readTargetRadii(target) {
    const cached = targetRadiusCache.get(target);
    if (cached) return cached;

    const style = window.getComputedStyle(target);
    const parseRadius = (value) => {
      const values = value.split(" ").map((part) => Number.parseFloat(part) || 0);
      return point(values[0], values[1] ?? values[0]);
    };
    const radii = {
      topLeft: parseRadius(style.borderTopLeftRadius),
      topRight: parseRadius(style.borderTopRightRadius),
      bottomRight: parseRadius(style.borderBottomRightRadius),
      bottomLeft: parseRadius(style.borderBottomLeftRadius),
    };
    targetRadiusCache.set(target, radii);
    return radii;
  }

  function getTargetRect(target) {
    if (!target?.isConnected) return null;
    const bounds = target.getBoundingClientRect();
    const padding = 10;
    const baseRadii = readTargetRadii(target);
    const expand = (radius) => point(
      radius.x > 0 ? radius.x + padding : 0,
      radius.y > 0 ? radius.y + padding : 0,
    );
    const radii = {
      topLeft: expand(baseRadii.topLeft),
      topRight: expand(baseRadii.topRight),
      bottomRight: expand(baseRadii.bottomRight),
      bottomLeft: expand(baseRadii.bottomLeft),
    };
    const rect = {
      left: bounds.left - padding,
      top: bounds.top - padding,
      right: bounds.right + padding,
      bottom: bounds.bottom + padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
    };

    const radiusScale = min(
      1,
      rect.width / max(1, radii.topLeft.x + radii.topRight.x),
      rect.width / max(1, radii.bottomLeft.x + radii.bottomRight.x),
      rect.height / max(1, radii.topLeft.y + radii.bottomLeft.y),
      rect.height / max(1, radii.topRight.y + radii.bottomRight.y),
    );
    Object.values(radii).forEach((radius) => {
      radius.x *= radiusScale;
      radius.y *= radiusScale;
    });

    const { topLeft, topRight, bottomRight, bottomLeft } = radii;
    rect.segments = [
      { type: "line", startX: rect.left + topLeft.x, startY: rect.top, endX: rect.right - topRight.x, endY: rect.top, length: rect.width - topLeft.x - topRight.x },
      { type: "arc", centerX: rect.right - topRight.x, centerY: rect.top + topRight.y, radiusX: topRight.x, radiusY: topRight.y, startAngle: -PI / 2, endAngle: 0, length: quarterEllipseLength(topRight.x, topRight.y) },
      { type: "line", startX: rect.right, startY: rect.top + topRight.y, endX: rect.right, endY: rect.bottom - bottomRight.y, length: rect.height - topRight.y - bottomRight.y },
      { type: "arc", centerX: rect.right - bottomRight.x, centerY: rect.bottom - bottomRight.y, radiusX: bottomRight.x, radiusY: bottomRight.y, startAngle: 0, endAngle: PI / 2, length: quarterEllipseLength(bottomRight.x, bottomRight.y) },
      { type: "line", startX: rect.right - bottomRight.x, startY: rect.bottom, endX: rect.left + bottomLeft.x, endY: rect.bottom, length: rect.width - bottomRight.x - bottomLeft.x },
      { type: "arc", centerX: rect.left + bottomLeft.x, centerY: rect.bottom - bottomLeft.y, radiusX: bottomLeft.x, radiusY: bottomLeft.y, startAngle: PI / 2, endAngle: PI, length: quarterEllipseLength(bottomLeft.x, bottomLeft.y) },
      { type: "line", startX: rect.left, startY: rect.bottom - bottomLeft.y, endX: rect.left, endY: rect.top + topLeft.y, length: rect.height - bottomLeft.y - topLeft.y },
      { type: "arc", centerX: rect.left + topLeft.x, centerY: rect.top + topLeft.y, radiusX: topLeft.x, radiusY: topLeft.y, startAngle: PI, endAngle: PI * 1.5, length: quarterEllipseLength(topLeft.x, topLeft.y) },
    ].filter((segment) => segment.length > 0);
    rect.perimeter = rect.segments.reduce((total, segment) => total + segment.length, 0);
    return rect;
  }

  function drawTargetTexture(rect, time, strength) {
    const sampleCount = min(320, max(140, Math.ceil(rect.perimeter / 5)));
    context.save();
    context.lineWidth = 0.78;

    for (let layer = 0; layer < 4; layer += 1) {
      context.beginPath();
      for (let index = 0; index <= sampleCount; index += 1) {
        const progress = index / sampleCount;
        const edge = perimeterPoint(rect, progress);
        const offset = noise(edge.x / 7 + time * 8, edge.y / 7, 101 + layer * 13) * (0.45 + layer * 0.7);
        const x = edge.x + offset;
        const y = edge.y + offset;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.globalAlpha = strength * [0.92, 0.56, 0.34, 0.22][layer];
      context.stroke();
    }

    context.globalAlpha = strength * 0.96;
    many(18, (index) => {
      const progress = index / 18 + sin(time * 0.8 + index) * 0.006;
      const edge = perimeterPoint(rect, progress);
      const radius = 0.8 + (sin(time * 2 + index * 1.7) + 1) * 0.45;
      drawCircle(edge.x, edge.y, radius);
      return null;
    });
    context.restore();
  }

  function spawnSwarm() {
    const particles = many(333, () => ({
      originX: random(window.innerWidth),
      originY: random(window.innerHeight),
      x: 0,
      y: 0,
      parallaxX: random(0.045, -0.0225),
      parallaxY: random(0.09, 0.025),
      phase: random(PI * 2),
      driftRate: random(0.08, 0.05),
      driftX: random(5, 2),
      driftY: random(7, 3),
      twinkleRate: random(0.55, 0.35),
      length: 0,
      radius: 0,
    }));
    const directions = many(9, (index) => ({
      x: cos((index / 9) * PI * 2),
      y: sin((index / 9) * PI * 2),
    }));
    let centerX = pointerX;
    let centerY = pointerY;

    function paintParticle(particle, creatureAmount, reach, time, connected) {
      if (creatureAmount > 0.01 && particle.length) {
        context.save();
        context.globalAlpha = creatureAmount;
        directions.forEach((direction) => {
          const anchorX = centerX + direction.x * reach;
          const anchorY = centerY + direction.y * reach;
          const pull = particle.length * particle.length;
          drawThread(
            lerp(anchorX, particle.x, pull),
            lerp(anchorY, particle.y, pull),
            anchorX,
            anchorY,
          );
        });
        context.restore();
      }

      const freeStarAmount = connected ? 0 : 1;
      const twinkle = (sin(time * particle.twinkleRate + particle.phase) + 1) / 2;
      const visualX = wrap(
        particle.x + sin(time * particle.driftRate + particle.phase) * particle.driftX * freeStarAmount,
        width,
      );
      const visualY = wrap(
        particle.y + cos(time * particle.driftRate * 0.82 + particle.phase) * particle.driftY * freeStarAmount,
        height,
      );
      context.save();
      context.globalAlpha = connected ? 1 : lerp(0.58, 0.92, twinkle);
      drawCircle(visualX, visualY, particle.radius * (connected ? 1 : lerp(0.82, 1.16, twinkle)));
      context.restore();
    }

    return {
      follow(x, y) {
        centerX = x;
        centerY = y;
      },
      tick(time, delta, creatureAmount = 1) {
        const skyScroll = window.scrollY;
        const reach = width / 125;

        let connected = 0;
        particles.forEach((particle) => {
          particle.x = wrap(particle.originX + skyScroll * particle.parallaxX, width);
          particle.y = wrap(particle.originY - skyScroll * particle.parallaxY, height);
          const distance = hypot(particle.x - centerX, particle.y - centerY);
          let radius = min(2, width / distance / 5);
          const nearCursor = creatureAmount > 0.05 && distance < width / 10 && connected < 8;
          if (nearCursor) {
            connected += 1;
            radius *= 1.5;
          }
          particle.radius = radius;
          particle.length = clamp(
            particle.length + (nearCursor ? delta / 0.22 : -delta / 0.18),
          );
          paintParticle(particle, creatureAmount, reach, time, nearCursor);
        });
      },
    };
  }

  syncCanvas();
  const swarms = many(1, spawnSwarm);

  function handlePointerMove(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;

    activeTarget = resolveInteractiveTarget(event.target);
    swarms.forEach((swarm) => swarm.follow(pointerX, pointerY));
  }

  function handlePointerLeave() {
    activeTarget = null;
    swarms.forEach((swarm) => swarm.follow(-100, -100));
  }

  function handleFocusIn(event) {
    activeTarget = resolveInteractiveTarget(event.target);
  }

  function handleFocusOut() {
    activeTarget = null;
  }

  function render(timestamp) {
    frame = window.requestAnimationFrame(render);
    if (document.hidden) return;

    syncCanvas();
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.strokeStyle = "rgba(255, 255, 255, 0.86)";
    context.lineWidth = 0.72;
    const time = timestamp / 1000;
    const delta = previousTimestamp ? min(0.05, (timestamp - previousTimestamp) / 1000) : 0;
    previousTimestamp = timestamp;
    const currentRect = getTargetRect(activeTarget);

    if (currentRect) lastTargetRect = currentRect;
    targetProgress = clamp(
      targetProgress + (currentRect ? delta / 0.24 : -delta / 0.28),
    );
    const targetStrength = smoothstep(targetProgress);

    if (lastTargetRect && targetStrength > 0.01) {
      drawTargetTexture(lastTargetRect, time, targetStrength);
    }

    swarms.forEach((swarm) => swarm.tick(time, delta, 1 - targetStrength));
  }

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("focusout", handleFocusOut);
  document.body.classList.add("has-spider-cursor");
  frame = window.requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    window.cancelAnimationFrame(frame);
  }, { once: true });
}

initSpiderCursor();

function initHeroTextEffect() {
  const textEffects = Array.from(document.querySelectorAll("[data-hero-text-effect]"));
  const supportingElements = Array.from(document.querySelectorAll("[data-hero-reveal]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  textEffects.forEach((element) => {
    const text = element.textContent;
    const fragment = document.createDocumentFragment();

    element.textContent = "";
    element.setAttribute("aria-hidden", "true");

    Array.from(text).forEach((character) => {
      const span = document.createElement("span");
      span.className = "hero-char";
      span.textContent = character === " " ? "\u00a0" : character;
      fragment.append(span);
    });

    element.append(fragment);
  });

  if (!window.gsap || reduceMotion) return;

  textEffects.forEach((element) => {
    const characters = element.querySelectorAll(".hero-char");
    const delay = Number.parseFloat(element.dataset.heroDelay || "0");

    window.gsap.fromTo(
      characters,
      { autoAlpha: 0, rotateX: 90, y: 10 },
      {
        autoAlpha: 1,
        rotateX: 0,
        y: 0,
        duration: 0.2,
        delay,
        stagger: 0.05,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
      },
    );
  });

  supportingElements.forEach((element) => {
    const delay = Number.parseFloat(element.dataset.heroDelay || "0");
    const useBlur = element.dataset.heroPreset === "blur";

    window.gsap.fromTo(
      element,
      { autoAlpha: 0, y: useBlur ? 8 : 10, filter: useBlur ? "blur(8px)" : "blur(0px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: useBlur ? 0.5 : 0.32,
        delay,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility,filter",
      },
    );
  });
}

initHeroTextEffect();

function initFAQAccordion() {
  const title = document.querySelector("[data-faq-title]");
  const items = Array.from(document.querySelectorAll("[data-faq-item]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    const fragment = document.createDocumentFragment();
    title.textContent = "";

    words.forEach((word) => {
      const span = document.createElement("span");
      span.className = "faq-title__word";
      span.textContent = word;
      span.setAttribute("aria-hidden", "true");
      fragment.append(span, document.createTextNode(" "));
    });

    title.append(fragment);
  }

  const setOpen = (item, shouldOpen) => {
    const trigger = item.querySelector(".faq-trigger");
    const answer = item.querySelector("[data-faq-answer]");
    if (!trigger || !answer) return;

    trigger.setAttribute("aria-expanded", String(shouldOpen));
    answer.setAttribute("aria-hidden", String(!shouldOpen));
    item.classList.toggle("is-open", shouldOpen);

    if (reduceMotion) {
      answer.style.height = shouldOpen ? "auto" : "0px";
      answer.style.opacity = shouldOpen ? "1" : "0";
      return;
    }

    window.clearTimeout(answer.closeTimer);

    if (shouldOpen) {
      answer.style.height = "auto";
      window.requestAnimationFrame(() => {
        answer.style.opacity = "1";
      });
      return;
    }

    answer.style.opacity = "0";
    answer.closeTimer = window.setTimeout(() => {
      if (!item.classList.contains("is-open")) answer.style.height = "0px";
    }, 200);
  };

  items.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const answer = item.querySelector("[data-faq-answer]");
    if (!trigger || !answer) return;

    answer.style.height = "0px";
    answer.style.opacity = "0";

    trigger.addEventListener("click", () => {
      const willOpen = trigger.getAttribute("aria-expanded") !== "true";
      items.forEach((otherItem) => setOpen(otherItem, otherItem === item && willOpen));
    });

  });
}

initFAQAccordion();

function initCareerTimeline() {
  const timeline = document.querySelector("[data-career-timeline]");
  const rail = timeline?.querySelector(".career-tabs__rail");
  const tabs = Array.from(timeline?.querySelectorAll("[data-career-tab]") ?? []);
  const panels = Array.from(timeline?.querySelectorAll("[data-career-panel]") ?? []);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!timeline || !rail || !tabs.length || tabs.length !== panels.length) return;

  let activeIndex = tabs.findIndex((tab) => tab.classList.contains("is-active"));
  let cleanupTimer = 0;
  if (activeIndex < 0) activeIndex = 0;

  const setProgress = (index) => {
    const railRect = rail.getBoundingClientRect();
    const tabRect = tabs[index].getBoundingClientRect();
    const activeCenter = tabRect.left + tabRect.width / 2;
    const progress = Math.min(1, Math.max(0, (activeCenter - railRect.left) / railRect.width));
    timeline.style.setProperty("--career-progress", String(progress));
  };

  const activate = (nextIndex, shouldFocus = false) => {
    if (nextIndex === activeIndex || nextIndex < 0 || nextIndex >= tabs.length) return;

    window.clearTimeout(cleanupTimer);
    const previousIndex = activeIndex;
    const previousPanel = panels[previousIndex];
    const nextPanel = panels[nextIndex];
    const direction = nextIndex > previousIndex ? "forward" : "backward";

    panels.forEach((panel, index) => {
      if (index === previousIndex || index === nextIndex) return;
      panel.hidden = true;
      panel.classList.remove("is-active", "is-leaving");
    });

    timeline.dataset.direction = direction;
    previousPanel.classList.remove("is-active");
    previousPanel.classList.add("is-leaving");
    previousPanel.setAttribute("aria-hidden", "true");

    nextPanel.hidden = false;
    nextPanel.classList.remove("is-leaving");
    nextPanel.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => nextPanel.classList.add("is-active"));

    tabs.forEach((tab, index) => {
      const isActive = index === nextIndex;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    setProgress(nextIndex);
    activeIndex = nextIndex;

    cleanupTimer = window.setTimeout(() => {
      previousPanel.hidden = true;
      previousPanel.classList.remove("is-leaving");
    }, reduceMotion ? 120 : 240);

    if (shouldFocus) tabs[nextIndex].focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(index));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      activate(nextIndex, true);
    });
  });

  setProgress(activeIndex);
  window.addEventListener("resize", () => setProgress(activeIndex), { passive: true });
}

initCareerTimeline();

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-contact-status]");
  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    status.textContent = "Тестовое сообщение готово. Отправка пока не подключена.";
  });
}

function initContactGlobe() {
  const canvas = document.querySelector("[data-contact-globe]");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const container = canvas.closest(".contact-globe");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tilt = -0.16;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let rotation = -0.78;
  let visible = false;
  let frameId = 0;
  let previousTime = 0;

  const syncSize = () => {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, rect.width);
    const nextHeight = Math.max(1, rect.height);
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (nextWidth === width && nextHeight === height && nextRatio === ratio) return;

    width = nextWidth;
    height = nextHeight;
    ratio = nextRatio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const project = (latitude, longitude) => {
    const phi = (latitude * Math.PI) / 180;
    const lambda = (longitude * Math.PI) / 180 + rotation;
    const baseX = Math.cos(phi) * Math.sin(lambda);
    const baseY = Math.sin(phi);
    const baseZ = Math.cos(phi) * Math.cos(lambda);
    const y = baseY * Math.cos(tilt) - baseZ * Math.sin(tilt);
    const z = baseY * Math.sin(tilt) + baseZ * Math.cos(tilt);
    return { x: baseX, y, z };
  };

  const drawLine = (points, centerX, centerY, radius, alpha = 1) => {
    let drawing = false;
    context.beginPath();

    points.forEach(([latitude, longitude]) => {
      const point = project(latitude, longitude);
      const x = centerX + point.x * radius;
      const y = centerY - point.y * radius;

      if (point.z > 0.005) {
        if (!drawing) context.moveTo(x, y);
        else context.lineTo(x, y);
        drawing = true;
      } else {
        drawing = false;
      }
    });

    context.globalAlpha = alpha;
    context.stroke();
  };

  const range = (start, end, step) => {
    const values = [];
    for (let value = start; value <= end; value += step) values.push(value);
    return values;
  };

  const draw = () => {
    syncSize();
    context.clearRect(0, 0, width, height);

    const radius = Math.min(width, height) * 0.43;
    const centerX = width / 2;
    const centerY = height * 0.49;
    const glow = context.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.12);
    glow.addColorStop(0, "rgba(114, 201, 139, 0.10)");
    glow.addColorStop(0.72, "rgba(114, 201, 139, 0.025)");
    glow.addColorStop(1, "rgba(114, 201, 139, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(centerX, centerY, radius * 1.12, 0, Math.PI * 2);
    context.fill();

    context.lineWidth = 0.8;
    context.strokeStyle = "rgba(244, 243, 238, 0.38)";
    range(-60, 60, 20).forEach((latitude) => {
      const points = range(-180, 180, 3).map((longitude) => [latitude, longitude]);
      drawLine(points, centerX, centerY, radius, 0.38);
    });

    range(-150, 180, 30).forEach((longitude) => {
      const points = range(-90, 90, 3).map((latitude) => [latitude, longitude]);
      drawLine(points, centerX, centerY, radius, 0.3);
    });

    context.globalAlpha = 1;
    context.lineWidth = 1.15;
    context.strokeStyle = "rgba(244, 243, 238, 0.72)";
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.stroke();

    const marker = project(40.18, 44.51);
    if (marker.z > 0) {
      const x = centerX + marker.x * radius;
      const y = centerY - marker.y * radius;
      context.fillStyle = "rgba(114, 201, 139, 0.18)";
      context.beginPath();
      context.arc(x, y, 8, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#72c98b";
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
  };

  const animate = (time) => {
    if (!visible || document.hidden) {
      frameId = 0;
      return;
    }

    if (previousTime) rotation += Math.min(time - previousTime, 32) * 0.000055;
    previousTime = time;
    draw();
    frameId = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (reduceMotion) {
      draw();
      return;
    }
    if (!frameId && visible && !document.hidden) {
      previousTime = 0;
      frameId = window.requestAnimationFrame(animate);
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    },
    { threshold: 0.08 },
  );

  observer.observe(container || canvas);
  new ResizeObserver(() => draw()).observe(container || canvas);
  document.addEventListener("visibilitychange", start);
  draw();
}

initContactForm();
initContactGlobe();

if (window.TastemakerMotion && window.gsap && window.ScrollTrigger) {
  window.TastemakerMotion.init({
    duration: 0.24,
    distance: 18,
    ease: "power3.out",
    staggerStep: 0.06,
  });

  window.gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    window.gsap.to(".hero__stars", {
      yPercent: 8,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  const sectionMotion = window.gsap.matchMedia();

  sectionMotion.add("(prefers-reduced-motion: no-preference)", () => {
    const scrollScene = (trigger, start = "top 78%") => window.gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger,
        start,
        once: true,
      },
    });

    const portfolio = scrollScene("[data-motion-section='portfolio']", "top 72%");
    portfolio
      .fromTo(
        ".section--portfolio .section-heading h2",
        { autoAlpha: 0, yPercent: 55, clipPath: "inset(0 0 100% 0)" },
        { autoAlpha: 1, yPercent: 0, clipPath: "inset(0 0 0% 0)", duration: 0.48 },
      )
      .fromTo(
        ".section--portfolio .section-heading p",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.24 },
        "-=0.24",
      )
      .fromTo(
        ".case-visual",
        { autoAlpha: 0, x: 32, clipPath: "inset(0 0 0 18%)" },
        { autoAlpha: 1, x: 0, clipPath: "inset(0 0 0 0%)", duration: 0.48 },
        "-=0.06",
      )
      .fromTo(
        ".time-machine__stop",
        { autoAlpha: 0, x: 18 },
        { autoAlpha: 1, x: 0, duration: 0.22, stagger: 0.055 },
        "-=0.22",
      );

    scrollScene("[data-motion-section='capabilities']", "top 88%").fromTo(
      "[data-motion-section='capabilities']",
      { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" },
      { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.48 },
    );

    scrollScene("[data-motion-section='proof']", "top 78%").fromTo(
      ".quote-marquee__row",
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.1 },
    );

    const about = scrollScene("[data-motion-section='about']", "top 74%");
    about
      .fromTo(
        ".section--about .section-heading h2",
        { autoAlpha: 0, yPercent: 55, clipPath: "inset(0 0 100% 0)" },
        { autoAlpha: 1, yPercent: 0, clipPath: "inset(0 0 0% 0)", duration: 0.48 },
      )
      .fromTo(
        ".about-note--fashion",
        { autoAlpha: 0, x: -32 },
        { autoAlpha: 1, x: 0, duration: 0.48 },
        "-=0.18",
      )
      .fromTo(
        ".about-note--film",
        { autoAlpha: 0, y: 32 },
        { autoAlpha: 1, y: 0, duration: 0.48 },
        "-=0.36",
      )
      .fromTo(
        ".about-note--games",
        { autoAlpha: 0, x: 32 },
        { autoAlpha: 1, x: 0, duration: 0.48 },
        "-=0.36",
      )
      .fromTo(
        ".about-badge",
        { autoAlpha: 0, y: 16, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, stagger: 0.06 },
        "-=0.18",
      );

    const faq = scrollScene("[data-motion-section='faq']", "top 74%");
    faq
      .fromTo(
        ".faq-title__word",
        { autoAlpha: 0, filter: "blur(6px)", y: 12 },
        {
          autoAlpha: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: "power2.inOut",
        },
      )
      .fromTo(
        ".faq__intro",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5 },
        0.4,
      )
      .fromTo(
        ".faq__list",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        0.5,
      )
      .fromTo(
        ".faq-item",
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out" },
        0.5,
      )
      .fromTo(
        ".faq-contact",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        0.72,
      );

    const contact = scrollScene("[data-motion-section='contact']", "top 76%");
    contact
      .fromTo(
        ".contact__kicker",
        { autoAlpha: 0, y: -12 },
        { autoAlpha: 1, y: 0, duration: 0.48 },
      )
      .fromTo(
        ".contact h2",
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.55 },
        "-=0.28",
      )
      .fromTo(
        ".contact__intro",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        "-=0.3",
      )
      .fromTo(
        ".contact__details",
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        "-=0.2",
      )
      .fromTo(
        ".contact-form",
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        "-=0.42",
      )
      .fromTo(
        ".contact-method",
        { autoAlpha: 0, x: -12 },
        { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.08 },
        "-=0.28",
      );

    const footer = scrollScene("[data-motion-section='footer']", "top 96%");
    footer
      .fromTo(
        ".footer__identity",
        { autoAlpha: 0, y: -8, filter: "blur(4px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8 },
        0.1,
      )
      .fromTo(
        ".footer__group",
        { autoAlpha: 0, y: -8, filter: "blur(4px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.1 },
        0.1,
      );
  });

  const careerMotion = window.gsap.matchMedia();

  careerMotion.add("(prefers-reduced-motion: no-preference)", () => {
    const career = window.gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: ".career-story",
        start: "top 72%",
        toggleActions: "play none none none",
      },
    });

    career
      .fromTo(
        ".career-stage__heading > *",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.08 },
      )
      .fromTo(
        ".career-tabs__rail",
        { autoAlpha: 0, scaleX: 0, transformOrigin: "left center" },
        { autoAlpha: 1, scaleX: 1, duration: 0.48 },
        "-=0.24",
      )
      .fromTo(
        ".career-tab",
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.06 },
        "-=0.24",
      )
      .fromTo(
        ".career-panel.is-active > *",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.08 },
        "-=0.18",
      );
  });

  careerMotion.add("(prefers-reduced-motion: reduce)", () => {
    window.gsap.set(".career-stage__heading > *, .career-tabs__rail, .career-tab, .career-panel.is-active > *", {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scaleX: 1,
    });
  });

}
