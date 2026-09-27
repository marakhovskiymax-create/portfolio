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
}
