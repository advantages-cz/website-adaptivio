(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const hero = document.querySelector('[data-parallax="hero"]');
  const heroSection = document.querySelector(".hero");
  const heroActions = document.querySelector(".hero-actions");
  const stickySections = [...document.querySelectorAll("[data-stickysection-scene]")].map(scene => ({
    scene,
    cards: [...scene.querySelectorAll("[data-stickysection-card]")]
  }));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeOutCubic = value => 1 - Math.pow(1 - value, 3);
  const canAnimateStickySections = () => !reducedMotion && window.innerWidth >= 1280;
  const getLayoutMode = () => {
    if (window.innerWidth <= 767) return "mobile";
    if (window.innerWidth <= 1279) return "tablet";
    return "desktop";
  };

  const syncStickySectionMotionState = () => {
    document.documentElement.classList.toggle("has-stickysection-motion", canAnimateStickySections());
  };

  const resetStickySectionCards = () => {
    for (const section of stickySections) {
      for (const card of section.cards) {
        card.classList.remove("is-before", "is-after");
        card.classList.add("is-active");
        card.style.removeProperty("--stickysection-card-y");
        card.style.removeProperty("--stickysection-card-scale");
        card.style.removeProperty("--stickysection-card-opacity");

        const timelineItem = card.closest(".timeline-card");
        if (timelineItem) {
          timelineItem.classList.remove("is-before", "is-after");
          timelineItem.classList.add("is-active");
          timelineItem.style.removeProperty("--timeline-line-progress");
        }
      }
    }
  };

  const updateStickySectionCards = () => {
    if (!stickySections.length) return;
    syncStickySectionMotionState();

    if (!canAnimateStickySections()) {
      resetStickySectionCards();
      return;
    }

    for (const section of stickySections) {
      if (!section.cards.length) continue;

      const rect = section.scene.getBoundingClientRect();
      const pinTop = 112;
      const pinnedHeight =
        section.scene.querySelector(".stickysection-pin, .timeline-pin")?.offsetHeight || 0;
      const total = Math.max(rect.height - pinnedHeight, 1);
      const passed = clamp(pinTop - rect.top, 0, total);
      const ratio = passed / total;
      const index = Math.min(section.cards.length - 1, Math.floor(ratio * section.cards.length));
      const step = 1 / section.cards.length;
      const travel = 96;
      const entrySpan = Math.min(0.42, step * 1.22);
      const cardProgresses = [];

      for (const [cardIndex, card] of section.cards.entries()) {
        const start = cardIndex === 0 ? -entrySpan * 1.8 : cardIndex * step * 0.9;
        const rawProgress = clamp((ratio - start) / entrySpan, 0, 1);
        const progress = easeOutCubic(rawProgress);
        cardProgresses[cardIndex] = progress;
        const y = (1 - progress) * travel;
        const scale = 0.94 + progress * 0.06;
        const opacity = 0.22 + progress * 0.78;

        card.style.setProperty("--stickysection-card-y", `${y.toFixed(1)}px`);
        card.style.setProperty("--stickysection-card-scale", scale.toFixed(3));
        card.style.setProperty("--stickysection-card-opacity", opacity.toFixed(3));
        card.classList.toggle("is-active", cardIndex === index);
        card.classList.toggle("is-before", cardIndex < index);
        card.classList.toggle("is-after", cardIndex > index);

        const timelineItem = card.closest(".timeline-card");
        if (timelineItem) {
          timelineItem.classList.toggle("is-active", cardIndex === index);
          timelineItem.classList.toggle("is-before", cardIndex < index);
          timelineItem.classList.toggle("is-after", cardIndex > index);
        }
      }

      for (const [cardIndex, card] of section.cards.entries()) {
        const nextProgress = cardIndex < section.cards.length - 1 ? cardProgresses[cardIndex + 1] : 0;
        const lineTarget = card.closest(".timeline-card") || card;
        lineTarget.style.setProperty("--timeline-line-progress", nextProgress.toFixed(3));
      }
    }
  };

  const update = () => {
    const y = window.scrollY;

    if (header) {
      header.classList.toggle("is-solid", y > 40);
    }

    if (header && heroSection && heroActions) {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const headerHeight = header.offsetHeight;
      const showHeaderCta = heroBottom <= headerHeight + 24;
      header.classList.toggle("is-cta-visible", showHeaderCta);
      heroActions.classList.toggle("is-hidden", showHeaderCta);
    }

    if (!reducedMotion && hero) {
      hero.style.setProperty("--parallax-y", `${clamp(y * 0.18, 0, 120)}px`);
    }

    updateStickySectionCards();
  };

  let ticking = false;
  let resizeTimeout = null;
  let lastLayoutMode = getLayoutMode();
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  const requestResizeUpdate = () => {
    const nextLayoutMode = getLayoutMode();
    const layoutChanged = nextLayoutMode !== lastLayoutMode;
    lastLayoutMode = nextLayoutMode;

    if (layoutChanged) {
      resetStickySectionCards();
      syncStickySectionMotionState();
    }

    requestUpdate();

    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      resetStickySectionCards();
      syncStickySectionMotionState();
      requestUpdate();
      window.requestAnimationFrame(requestUpdate);
    }, 140);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestResizeUpdate);
  window.addEventListener("load", requestUpdate);
})();
