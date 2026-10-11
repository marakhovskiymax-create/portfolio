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
      link.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
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
let carouselIndex = 0;
let carouselPointerId = null;
let carouselStartX = 0;
let carouselDeltaX = 0;

function renderCarousel(nextIndex) {
  if (!carouselTrack || !carouselSlides.length) return;
  carouselIndex = (nextIndex + carouselSlides.length) % carouselSlides.length;
  carouselTrack.style.transform = `translate3d(${-carouselIndex * 100}%, 0, 0)`;
  if (carouselCurrent) carouselCurrent.textContent = String(carouselIndex + 1).padStart(2, "0");

  carouselSlides.forEach((slide, index) => {
    slide.setAttribute("aria-hidden", String(index !== carouselIndex));
  });
}

carousel?.querySelector("[data-carousel-prev]")?.addEventListener("click", () => renderCarousel(carouselIndex - 1));
carousel?.querySelector("[data-carousel-next]")?.addEventListener("click", () => renderCarousel(carouselIndex + 1));

carousel?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  renderCarousel(carouselIndex + (event.key === "ArrowRight" ? 1 : -1));
});

carouselViewport?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  carouselPointerId = event.pointerId;
  carouselStartX = event.clientX;
  carouselDeltaX = 0;
  carouselViewport.setPointerCapture(event.pointerId);
});

carouselViewport?.addEventListener("pointermove", (event) => {
  if (event.pointerId !== carouselPointerId) return;
  carouselDeltaX = event.clientX - carouselStartX;
});

carouselViewport?.addEventListener("pointerup", (event) => {
  if (event.pointerId !== carouselPointerId) return;
  carouselViewport.releasePointerCapture(event.pointerId);
  if (Math.abs(carouselDeltaX) > 42) renderCarousel(carouselIndex + (carouselDeltaX < 0 ? 1 : -1));
  carouselPointerId = null;
});

renderCarousel(0);

const accordionItems = Array.from(document.querySelectorAll("[data-accordion] details"));
accordionItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    accordionItems.forEach((peer) => {
      if (peer !== item) peer.open = false;
    });
  });
});

const workCopy = {
  website: "Homepage, navigation, AI page, and pricing.",
  "in-app": "Integration pages that explain value and setup.",
  upgrades: "Plan comparison, AI plan, feature videos, and trial end.",
  renewal: "Clear progress feedback while a request is processing.",
  impact: "Reusable components and release-quality review.",
};

const workChips = Array.from(document.querySelectorAll("[data-work-target]"));
const workIndex = document.querySelector("[data-work-index]");
const workDescription = document.querySelector("[data-work-description]");
const workLink = document.querySelector("[data-work-link]");

function selectWorkChip(chip) {
  const index = workChips.indexOf(chip);
  const target = chip.dataset.workTarget;
  workChips.forEach((item) => {
    const active = item === chip;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  if (workIndex) workIndex.textContent = `${String(index + 1).padStart(2, "0")} / ${String(workChips.length).padStart(2, "0")}`;
  if (workDescription) workDescription.textContent = workCopy[target] ?? "";
  if (workLink) workLink.href = `#${target}`;
}

workChips.forEach((chip) => chip.addEventListener("click", () => selectWorkChip(chip)));
if (workChips[0]) selectWorkChip(workChips[0]);

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
