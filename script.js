const projectContent = {
  "eme-web": {
    title: "Convenient, consistent, system.",
    kind: "Web ecosystem",
    index: "01 / 03",
    caption: "Визуальная карточка проекта EME.WEB, экосистемы грузоперевозок.",
  },
  "eme-app": {
    title: "Workflows without friction.",
    kind: "Warehouse app",
    index: "02 / 03",
    caption: "Визуальная карточка проекта EME.APP, приложения для работы на складе.",
  },
  "lunch-balloon": {
    title: "Joy, ordered clearly.",
    kind: "E-commerce",
    index: "03 / 03",
    caption: "Визуальная карточка проекта Ланч Баллон, магазина воздушных шаров.",
  },
};

const visual = document.querySelector("[data-project-visual]");
const visualTitle = visual?.querySelector(".case-visual__title");
const visualKind = visual?.querySelector("[data-visual-kind]");
const visualYear = visual?.querySelector("[data-visual-year]");
const visualCaption = visual?.querySelector("[data-visual-caption]");
const projectList = document.querySelector(".project-list");
const projectRows = Array.from(document.querySelectorAll(".project-row"));

function mountFluidProjectHighlight() {
  if (!projectList || !projectRows.length) return;

  const highlight = document.createElement("span");
  highlight.className = "project-hover-highlight";
  highlight.setAttribute("aria-hidden", "true");
  projectList.prepend(highlight);

  const moveHighlight = (row) => {
    projectList.style.setProperty("--fluid-highlight-y", `${row.offsetTop}px`);
    projectList.style.setProperty("--fluid-row-height", `${row.offsetHeight}px`);
    highlight.classList.add("is-visible");
  };

  projectRows.forEach((row) => {
    row.addEventListener("pointerenter", () => moveHighlight(row));
    row.addEventListener("focus", () => moveHighlight(row));
  });

  projectList.addEventListener("pointerleave", () => highlight.classList.remove("is-visible"));
  projectList.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      if (!projectList.contains(document.activeElement)) highlight.classList.remove("is-visible");
    });
  });
}

function activateProject(button) {
  const project = projectContent[button.dataset.project];
  if (!project || !visual) return;

  document.querySelectorAll(".project-row").forEach((row) => {
    const isActive = row === button;
    row.classList.toggle("is-active", isActive);
    row.setAttribute("aria-pressed", String(isActive));
  });

  visual.dataset.projectVisual = button.dataset.project;
  visualTitle.textContent = project.title;
  visualKind.textContent = project.kind;
  visualYear.textContent = project.index;
  visualCaption.textContent = project.caption;

  if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.gsap.fromTo(
      visual.querySelector(".case-visual__panel"),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.24, ease: "power3.out" },
    );
  }
}

projectRows.forEach((button) => {
  button.addEventListener("click", () => activateProject(button));
  button.addEventListener("mouseenter", () => activateProject(button));
});

mountFluidProjectHighlight();

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

    const candidate = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
    activeTarget = candidate && !candidate.matches(":disabled, [aria-disabled='true']") ? candidate : null;
    swarms.forEach((swarm) => swarm.follow(pointerX, pointerY));
  }

  function handlePointerLeave() {
    activeTarget = null;
    swarms.forEach((swarm) => swarm.follow(-100, -100));
  }

  function handleFocusIn(event) {
    const candidate = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
    if (candidate && !candidate.matches(":disabled, [aria-disabled='true']")) activeTarget = candidate;
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
        ".project-row",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.06 },
        "-=0.06",
      )
      .fromTo(
        ".case-visual",
        { autoAlpha: 0, x: 32, clipPath: "inset(0 0 0 18%)" },
        { autoAlpha: 1, x: 0, clipPath: "inset(0 0 0 0%)", duration: 0.48 },
        "-=0.3",
      );

    scrollScene("[data-motion-section='capabilities']", "top 88%").fromTo(
      "[data-motion-section='capabilities']",
      { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" },
      { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.48 },
    );

    scrollScene("[data-motion-section='proof']", "top 78%").fromTo(
      ".quote-card",
      { autoAlpha: 0, y: 48, scale: 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.48, stagger: 0.08 },
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

    const contact = scrollScene("[data-motion-section='contact']", "top 76%");
    contact
      .fromTo(
        ".contact__kicker",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.24 },
      )
      .fromTo(
        ".contact h2",
        { autoAlpha: 0, yPercent: 35, clipPath: "inset(0 0 100% 0)" },
        { autoAlpha: 1, yPercent: 0, clipPath: "inset(0 0 0% 0)", duration: 0.48 },
        "-=0.06",
      )
      .fromTo(
        ".contact__link",
        { autoAlpha: 0, x: -18 },
        { autoAlpha: 1, x: 0, duration: 0.24 },
        "-=0.12",
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

  const buildCareerTimeline = (start, end) => {
    const stops = window.gsap.utils.toArray("[data-career-stop]");
    const drawPaths = window.gsap.utils.toArray("[data-career-draw]");
    const revealMoments = [0.045, 0.24, 0.455, 0.655, 0.845];

    window.gsap.set(stops, { autoAlpha: 0, y: 16 });
    window.gsap.set(drawPaths, { strokeDashoffset: 1 });

    const timeline = window.gsap.timeline({
      defaults: { overwrite: "auto" },
      scrollTrigger: {
        trigger: ".career-story",
        start,
        end,
        scrub: 0.6,
      },
    });

    timeline.to(drawPaths, { strokeDashoffset: 0, duration: 1, ease: "none" }, 0);

    stops.forEach((stop, index) => {
      timeline.to(
        stop,
        { autoAlpha: 1, y: 0, duration: 0.09, ease: "power3.out" },
        revealMoments[index],
      );
    });

    return timeline;
  };

  const careerMotion = window.gsap.matchMedia();

  careerMotion.add(
    "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
    () => {
      buildCareerTimeline("top top", "bottom bottom");
    },
  );

  careerMotion.add(
    "(max-width: 900px) and (prefers-reduced-motion: no-preference)",
    () => {
      buildCareerTimeline("top 8%", "bottom 72%");
    },
  );

  careerMotion.add("(prefers-reduced-motion: reduce)", () => {
    window.gsap.set("[data-career-stop]", { autoAlpha: 1, y: 0 });
    window.gsap.set("[data-career-draw]", { strokeDashoffset: 0 });
  });

  const buildProcessTimeline = (start, end) => {
    const baseline = document.querySelector(".process-baseline");
    const stems = window.gsap.utils.toArray(".process-step__stem");
    const steps = window.gsap.utils.toArray("[data-process-step]");
    const revealMoments = [0.08, 0.32, 0.56, 0.8];

    window.gsap.set(baseline, { scaleX: 0, transformOrigin: "left center" });
    window.gsap.set(stems, { scaleY: 0, transformOrigin: "bottom center" });
    window.gsap.set(steps, { autoAlpha: 0, y: 14 });

    const timeline = window.gsap.timeline({
      defaults: { overwrite: "auto" },
      scrollTrigger: {
        trigger: ".section--process",
        start,
        end,
        scrub: 0.6,
      },
    });

    timeline.to(baseline, { scaleX: 1, duration: 1, ease: "none" }, 0);

    steps.forEach((step, index) => {
      timeline.to(
        stems[index],
        { scaleY: 1, duration: 0.08, ease: "power2.out" },
        revealMoments[index],
      );
      timeline.to(
        step,
        { autoAlpha: 1, y: 0, duration: 0.1, ease: "power3.out" },
        revealMoments[index] + 0.035,
      );
    });

    return timeline;
  };

  const processMotion = window.gsap.matchMedia();

  processMotion.add(
    "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
    () => buildProcessTimeline("top top", "bottom bottom"),
  );

  processMotion.add(
    "(max-width: 900px) and (prefers-reduced-motion: no-preference)",
    () => buildProcessTimeline("top 72%", "bottom 45%"),
  );

  processMotion.add("(prefers-reduced-motion: reduce)", () => {
    window.gsap.set(".process-baseline", { scaleX: 1, transformOrigin: "left center" });
    window.gsap.set(".process-step__stem", { scaleY: 1, transformOrigin: "bottom center" });
    window.gsap.set("[data-process-step]", { autoAlpha: 1, y: 0 });
  });
}
