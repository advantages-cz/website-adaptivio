(function () {
  const HEADER_SOLID_SCROLL_Y = 40;
  const HEADER_CTA_OFFSET = 24;
  const MAX_PARALLAX_Y = 120;
  const PARALLAX_FACTOR = 0.18;
  const SCROLL_CUE_BOTTOM_THRESHOLD = 48;

  const createPageChrome = ({
    header,
    hero,
    heroSection,
    heroActions,
    scrollCue,
    reducedMotion
  }) => {
    const updateHeaderState = y => {
      if (header) {
        header.classList.toggle("is-solid", y > HEADER_SOLID_SCROLL_Y);
      }

      if (header && heroSection && heroActions) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        const headerHeight = header.offsetHeight;
        const showHeaderCta = heroBottom <= headerHeight + HEADER_CTA_OFFSET;
        header.classList.toggle("is-cta-visible", showHeaderCta);
        heroActions.classList.toggle("is-hidden", showHeaderCta);
      }
    };

    const updateHeroParallax = y => {
      if (!reducedMotion && hero) {
        hero.style.setProperty("--parallax-y", `${Math.min(MAX_PARALLAX_Y, Math.max(0, y * PARALLAX_FACTOR))}px`);
      }
    };

    const updateScrollCueVisibility = y => {
      if (!scrollCue) return;

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const documentHeight = document.documentElement.scrollHeight || 0;
      const isNearBottom = y + viewportHeight >= documentHeight - SCROLL_CUE_BOTTOM_THRESHOLD;
      scrollCue.classList.toggle("is-hidden", isNearBottom);
    };

    return {
      updateHeaderState,
      updateHeroParallax,
      updateScrollCueVisibility
    };
  };

  window.createPageChrome = createPageChrome;
})();
