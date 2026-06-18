(() => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const hero = document.querySelector('[data-parallax="hero"]');
  const heroSection = document.querySelector(".hero");
  const heroActions = document.querySelector(".hero-actions");
  const scrollCue = document.querySelector(".scroll-cue");
  const articleSections = [...document.querySelectorAll("article > section")];
  const siteFooter = document.querySelector(".site-footer");
  const googleForms = [...document.querySelectorAll("[data-google-form]")];
  const scrollToTop = (top, behavior) => {
    window.scrollTo({ top, behavior });
  };

  let ticking = false;
  let resizeTimeout = null;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updatePageState();
      ticking = false;
    });
  };

  const stickySectionsController = window.createStickySectionsController({
    reducedMotion,
    header,
    getRequestUpdate: () => requestUpdate
  });
  const navigation = window.createPageNavigation({
    header,
    reducedMotion,
    articleSections,
    siteFooter,
    scrollToTop,
    requestUpdate
  });
  const pageChrome = window.createPageChrome({
    header,
    hero,
    heroSection,
    heroActions,
    scrollCue,
    reducedMotion
  });

  const updatePageState = () => {
    const y = window.scrollY;

    pageChrome.updateHeaderState(y);
    pageChrome.updateHeroParallax(y);
    pageChrome.updateScrollCueVisibility(y);
    stickySectionsController.update();
  };

  const requestResizeUpdate = () => {
    // Always clear sticky inline state during resize so repeated manual dragging
    // cannot leave cards in a mixed desktop/tablet/mobile visual state.
    stickySectionsController.requestResizeUpdate();

    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      stickySectionsController.requestResizeUpdate();
      requestUpdate();
      window.requestAnimationFrame(requestUpdate);
    }, 180);
  };

  const setupScrollCue = () => {
    if (!scrollCue) return;

    scrollCue.addEventListener("click", () => {
      const activeStickySection = stickySectionsController.canAnimateStickySections()
        ? stickySectionsController.getCurrentStickySection()
        : null;
      const stickyAdvanceTop = activeStickySection
        ? stickySectionsController.getStickyAdvanceScrollTop(activeStickySection)
        : null;
      const top = stickyAdvanceTop ?? (() => {
        const nextSection = activeStickySection
          ? navigation.getNextSectionAfter(activeStickySection.section)
          : navigation.getNextSection();
        if (nextSection) return navigation.getSectionScrollTop(nextSection);
        return navigation.getFooterScrollTop();
      })();

      if (top === null) return;

      scrollToTop(top, reducedMotion ? "auto" : "smooth");
    });
  };

  const setupPageEvents = () => {
    navigation.setupAnchorLinks();
    setupScrollCue();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestResizeUpdate);
    window.addEventListener("load", requestUpdate);
    window.addEventListener("pageshow", requestUpdate);
    window.addEventListener("hashchange", () => navigation.scrollToHashTarget(window.location.hash, "auto"));
  };

  const initializePage = () => {
    stickySectionsController.setupTimelineRoutes();
    window.setupGoogleForms(googleForms);
    navigation.settleInitialHashTarget();
    setupPageEvents();
    updatePageState();
  };

  initializePage();
})();
