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
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector("[data-spider-cursor]");
  const canTrackPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!hero || !canvas || !canTrackPointer || reduceMotion) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const { sin, cos, PI, hypot, min, max } = Math;
  const many = (count, factory) => Array.from({ length: count }, (_, index) => factory(index));
  const random = (range = 1, offset = 0) => Math.random() * range + offset;
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const point = (x, y) => ({ x, y });
  const noise = (x, y, seed = 101) => {
    const first = sin(0.3 * x + 1.4 * seed + 2 + 2.5 * sin(0.4 * y - 1.3 * seed + 1));
    const second = sin(0.2 * y + 1.5 * seed + 2.8 + 2.3 * sin(0.5 * x - 1.2 * seed + 0.5));
    return first + second;
  };

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let visible = true;
  let frame = 0;

  function syncCanvas() {
    const nextWidth = hero.clientWidth;
    const nextHeight = hero.clientHeight;
    const nextRatio = min(window.devicePixelRatio || 1, 2);
    if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;

    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
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

  function spawnSwarm() {
    const particles = many(333, () => ({
      x: random(window.innerWidth),
      y: random(window.innerHeight),
      length: 0,
      radius: 0,
    }));
    const directions = many(9, (index) => ({
      x: cos((index / 9) * PI * 2),
      y: sin((index / 9) * PI * 2),
    }));
    const phase = random(100);
    let targetX = random(window.innerWidth);
    let targetY = random(window.innerHeight);
    let centerX = random(window.innerWidth);
    let centerY = random(window.innerHeight);
    const xSpeed = random(0.5, 0.5);
    const ySpeed = random(0.5, 0.5);
    const drift = point(random(50, 50), random(50, 50));
    let reach = window.innerWidth / random(100, 150);

    function paintParticle(particle) {
      directions.forEach((direction) => {
        if (!particle.length) return;
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
      drawCircle(particle.x, particle.y, particle.radius);
    }

    return {
      follow(x, y) {
        targetX = x;
        targetY = y;
      },
      tick(time) {
        const xOffset = cos(time * xSpeed + phase) * drift.x;
        const yOffset = sin(time * ySpeed + phase) * drift.y;
        const destinationX = targetX + xOffset;
        const destinationY = targetY + yOffset;
        centerX += min(width / 100, (destinationX - centerX) / 10);
        centerY += min(width / 100, (destinationY - centerY) / 10);
        reach = width / random(100, 150);

        let connected = 0;
        particles.forEach((particle) => {
          const distance = hypot(particle.x - centerX, particle.y - centerY);
          let radius = min(2, width / distance / 5);
          const nearCursor = distance < width / 10 && connected < 8;
          const direction = nearCursor ? 0.1 : -0.1;
          if (nearCursor) {
            connected += 1;
            radius *= 1.5;
          }
          particle.radius = radius;
          particle.length = max(0, min(particle.length + direction, 1));
          paintParticle(particle);
        });
      },
    };
  }

  syncCanvas();
  const swarms = many(2, spawnSwarm);

  function handlePointerMove(event) {
    const bounds = hero.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    swarms.forEach((swarm) => swarm.follow(x, y));
  }

  function handlePointerLeave(event) {
    const bounds = hero.getBoundingClientRect();
    swarms.forEach((swarm) => swarm.follow(event.clientX < bounds.left ? -80 : width + 80, event.clientY - bounds.top));
  }

  function render(timestamp) {
    frame = window.requestAnimationFrame(render);
    if (!visible) return;

    syncCanvas();
    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.strokeStyle = "rgba(255, 255, 255, 0.86)";
    context.lineWidth = 0.72;
    swarms.forEach((swarm) => swarm.tick(timestamp / 1000));
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });

  observer.observe(hero);
  hero.addEventListener("pointermove", handlePointerMove, { passive: true });
  hero.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  hero.classList.add("has-spider-cursor");
  frame = window.requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
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
