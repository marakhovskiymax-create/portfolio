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

document.querySelectorAll(".project-row").forEach((button) => {
  button.addEventListener("click", () => activateProject(button));
  button.addEventListener("mouseenter", () => activateProject(button));
});

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

if (window.TastemakerMotion && window.gsap && window.ScrollTrigger) {
  window.TastemakerMotion.init({
    duration: 0.22,
    distance: 14,
    ease: "power3.out",
    staggerStep: 0.055,
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

  const processMotion = window.gsap.matchMedia();

  processMotion.add("(prefers-reduced-motion: no-preference)", () => {
    const baseline = document.querySelector(".process-baseline");
    const stems = window.gsap.utils.toArray(".process-step__stem");
    const steps = window.gsap.utils.toArray("[data-process-step]");

    window.gsap.set(baseline, { scaleX: 0, transformOrigin: "left center" });
    window.gsap.set(stems, { scaleY: 0, transformOrigin: "bottom center" });
    window.gsap.set(steps, { autoAlpha: 0, y: 12 });

    window.gsap
      .timeline({
        scrollTrigger: {
          trigger: "[data-process-story]",
          start: "top 78%",
          once: true,
        },
      })
      .to(baseline, { scaleX: 1, duration: 0.48, ease: "power3.out" })
      .to(stems, { scaleY: 1, duration: 0.28, ease: "power3.out", stagger: 0.07 }, 0.12)
      .to(steps, { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out", stagger: 0.07 }, 0.2);
  });

  processMotion.add("(prefers-reduced-motion: reduce)", () => {
    window.gsap.set(".process-baseline, .process-step__stem, [data-process-step]", {
      autoAlpha: 1,
      clearProps: "transform",
    });
  });
}
