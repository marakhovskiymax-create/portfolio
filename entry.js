/* First-screen motion runs from HTML, independently of GSAP, images or fonts.
 * The original curve, letter intervals and reveal order are retained; first-screen
 * waiting gaps are compressed to 200ms so no control sits empty for seconds. */
(() => {
  "use strict";
  const handled = new WeakSet();
  const frames = (blur = false) => Array.from({ length: 201 }, (_, index) => {
    const offset = index / 200;
    const remaining = (1 - offset) ** 4;
    const frame = {
      offset,
      opacity: 1 - remaining,
      transform: blur
        ? `translateY(${8 * remaining}px)`
        : `translateY(${10 * remaining}px) rotateX(${90 * remaining}deg)`,
    };
    if (blur) frame.filter = `blur(${8 * remaining}px)`;
    return frame;
  });
  let characterFrames;
  let blurFrames;
  let supportFrames;

  function reveal(root) {
    if (!root || handled.has(root)) return;
    window.siteI18n?.apply(root);
    handled.add(root);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !Element.prototype.animate) return;

    characterFrames ||= frames();
    blurFrames ||= frames(true);
    supportFrames ||= Array.from({ length: 201 }, (_, index) => {
      const offset = index / 200;
      const remaining = (1 - offset) ** 4;
      return { offset, opacity: 1 - remaining, transform: `translateY(${10 * remaining}px)` };
    });
    const animations = [];
    const animate = (element, keyframes, duration, delay) => {
      const animation = element.animate(keyframes, { duration, delay, easing: "linear", fill: "backwards" });
      animation.pause();
      animation.currentTime = 0;
      animation.onfinish = () => animation.cancel();
      animations.push(animation);
    };
    const play = () => {
      const startTime = document.timeline.currentTime + Math.max(0, 500 - performance.now());
      animations.forEach((animation) => {
        animation.play();
        animation.startTime = startTime;
      });
    };

    try {
      if (root.matches(".hero")) {
        const words = Array.from(root.querySelectorAll("[data-hero-text-effect]"));
        const support = Array.from(root.querySelectorAll("[data-hero-reveal]"));
        const offsets = [...words, ...support].map((element) => Number(element.dataset.heroDelay || 0));
        const first = Math.min(...offsets);
        const span = Math.max(0.001, Math.max(...offsets) - first);
        const entryOffset = (element) => (Number(element.dataset.heroDelay || 0) - first) / span * 200;
        words.forEach((word) => {
          const text = word.textContent;
          word.textContent = "";
          word.setAttribute("aria-hidden", "true");
          const characters = Array.from(text, (letter) => {
            const span = document.createElement("span");
            span.className = "hero-char";
            span.textContent = letter === " " ? "\u00a0" : letter;
            return span;
          });
          word.append(...characters);
          characters.forEach((span, index) => {
            animate(span, characterFrames, 200, entryOffset(word) + index * 50);
          });
        });
        support.forEach((element) => {
          const blur = element.dataset.heroPreset === "blur";
          animate(element, blur ? blurFrames : supportFrames, blur ? 500 : 320, entryOffset(element));
        });
        play();
      } else {
        const title = root.querySelector("h1");
        if (!title) return;
        const text = title.textContent.trim();
        const visual = document.createElement("span");
        visual.setAttribute("aria-hidden", "true");
        title.setAttribute("aria-label", text);
        let index = 0;
        text.split(/[\t\n\r\f ]+/).forEach((word, wordIndex, words) => {
          const parts = document.body.classList.contains("eme-page") && window.siteI18n?.locale === "ru" && word === "дизайн-система."
            ? ["дизайн-", "система."] : [word];
          parts.forEach((part) => {
            const wrapper = document.createElement("span");
            wrapper.className = "case-motion-word";
            Array.from(part).forEach((letter) => {
              const span = document.createElement("span");
              span.className = "case-motion-char";
              span.textContent = letter;
              wrapper.append(span);
              animate(span, characterFrames, 200, index++ * 35);
            });
            visual.append(wrapper);
          });
          if (wordIndex < words.length - 1) visual.append(" ");
        });
        title.textContent = "";
        title.classList.add("case-motion-title");
        title.append(visual);
        root.querySelectorAll(".case-hero__lede, .case-meta").forEach((element) => {
          const meta = element.matches(".case-meta");
          animate(element, supportFrames, meta ? 320 : 280, meta ? 200 : 40);
        });
        if ("IntersectionObserver" in window) {
          const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            play();
          }, { rootMargin: "0px 0px -30% 0px", threshold: 0.01 });
          observer.observe(root);
        } else play();
      }
    } catch (error) {
      // An unavailable animation API must leave real text visible, never a blank screen.
      animations.forEach((animation) => animation.cancel());
      console.error("First-screen motion:", error);
    }
  }

  window.siteEntry = { reveal, has: (root) => Boolean(root && handled.has(root)) };
})();
