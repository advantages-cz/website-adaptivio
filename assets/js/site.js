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

  const getNextSection = () => {
    const offset = (header?.offsetHeight || 0) + 24;
    const currentY = window.scrollY;

    return articleSections.find(section => section.offsetTop > currentY + offset + 8) || null;
  };

  const getNextSectionAfter = currentSection => {
    if (!currentSection) return getNextSection();

    const currentIndex = articleSections.indexOf(currentSection);

    if (currentIndex === -1) return getNextSection();

    return articleSections[currentIndex + 1] || null;
  };

  const getSectionScrollTop = section => {
    const headerHeight = header?.offsetHeight || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const availableHeight = Math.max(0, viewportHeight - headerHeight);
    const focusTarget =
      section.querySelector(".quote-pin") ||
      section.querySelector(".stickysection-card.is-active") ||
      section.querySelector(".stickysection-pin, .final-inner") ||
      section.querySelector(".wrap, .section-head") ||
      section;
    const sectionTop = section.offsetTop;
    const focusTop = focusTarget.getBoundingClientRect().top + window.scrollY;
    const focusHeight = focusTarget.offsetHeight || section.offsetHeight || 0;
    const minTop = Math.max(0, sectionTop - headerHeight);
    const maxTop = Math.max(minTop, sectionTop + section.offsetHeight - viewportHeight);

    if (window.innerWidth <= 767) {
      return minTop;
    }

    if (focusHeight >= availableHeight) {
      return minTop;
    }

    const targetTop = focusTop - headerHeight - ((availableHeight - focusHeight) / 2);
    return Math.min(maxTop, Math.max(minTop, targetTop));
  };

  const getFooterScrollTop = () => {
    if (!siteFooter) return null;

    const headerHeight = header?.offsetHeight || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const minTop = Math.max(0, siteFooter.offsetTop - headerHeight);
    const maxTop = Math.max(minTop, document.documentElement.scrollHeight - viewportHeight);

    return Math.min(maxTop, Math.max(0, minTop));
  };

  const getHashTarget = hash => {
    if (!hash || hash === "#") return null;

    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch (error) {
      return document.getElementById(hash.slice(1));
    }
  };

  const getAnchorScrollTop = target => {
    const headerHeight = header?.offsetHeight || 0;
    const section = target.matches("article > section")
      ? target
      : target.closest("article > section");

    if (section && !section.classList.contains("response-form-section")) {
      return getSectionScrollTop(section);
    }

    const targetTop = target.getBoundingClientRect().top + window.scrollY;

    if (section?.classList.contains("response-form-section")) {
      const mobileFormOffset = window.innerWidth <= 767
        ? Math.min(28, Math.max(0, window.innerHeight * 0.015))
        : 0;

      return Math.max(0, targetTop - headerHeight - 8 + mobileFormOffset);
    }

    return Math.max(0, targetTop - headerHeight - 8);
  };

  const scrollToHashTarget = (hash = window.location.hash, behavior = "auto") => {
    const target = getHashTarget(hash);

    if (!target) return false;

    window.scrollTo({
      top: getAnchorScrollTop(target),
      behavior: reducedMotion ? "auto" : behavior
    });
    requestUpdate();

    return true;
  };

  const settleInitialHashTarget = () => {
    if (!window.location.hash) return;

    const scrollToTarget = () => {
      scrollToHashTarget(window.location.hash, "auto");
      window.requestAnimationFrame(() => scrollToHashTarget(window.location.hash, "auto"));
    };

    scrollToTarget();
    window.addEventListener("load", scrollToTarget, { once: true });

    if (document.fonts?.ready) {
      document.fonts.ready.then(scrollToTarget);
    }
  };

  const updateHeaderState = y => {
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
  };

  const updateHeroParallax = y => {
    if (!reducedMotion && hero) {
      hero.style.setProperty("--parallax-y", `${Math.min(120, Math.max(0, y * 0.18))}px`);
    }
  };

  const updateScrollCueVisibility = y => {
    if (!scrollCue) return;

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const documentHeight = document.documentElement.scrollHeight || 0;
    const bottomThreshold = 48;
    const isNearBottom = y + viewportHeight >= documentHeight - bottomThreshold;
    scrollCue.classList.toggle("is-hidden", isNearBottom);
  };

  const updatePageState = () => {
    const y = window.scrollY;

    updateHeaderState(y);
    updateHeroParallax(y);
    updateScrollCueVisibility(y);
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

  const setupGoogleForms = () => {
    for (const form of googleForms) {
      const status = form.querySelector("[data-form-status]");
      const submitButton = form.querySelector('button[type="submit"]');
      const defaultLabel = submitButton?.getAttribute("data-submit-label") || submitButton?.textContent || "";

      form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!form.reportValidity()) {
          return;
        }

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Odesílám…";
        }

        if (status) {
          status.textContent = "";
        }

        try {
          await fetch(form.action, {
            method: "POST",
            mode: "no-cors",
            body: new FormData(form)
          });

          const successUrl = form.getAttribute("data-success-url");

          if (successUrl) {
            window.location.assign(successUrl);
            return;
          }

          form.reset();

          if (status) {
            status.textContent = "Děkujeme, odpověď byla odeslána.";
          }
        } catch (error) {
          if (status) {
            status.textContent = "Odeslání se nepovedlo. Zkuste to prosím znovu.";
          }
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = defaultLabel;
          }
        }
      });
    }
  };

  const setupAnchorLinks = () => {
    document.addEventListener("click", event => {
      const link = event.target.closest('a[href^="#"]');

      if (!link) return;

      const hash = link.getAttribute("href");

      if (!getHashTarget(hash)) return;

      event.preventDefault();
      history.pushState(null, "", hash);
      scrollToHashTarget(hash, "smooth");
    });
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
          ? getNextSectionAfter(activeStickySection.section)
          : getNextSection();
        if (nextSection) return getSectionScrollTop(nextSection);
        return getFooterScrollTop();
      })();

      if (top === null) return;

      window.scrollTo({
        top,
        behavior: reducedMotion ? "auto" : "smooth"
      });
    });
  };

  const setupPageEvents = () => {
    setupAnchorLinks();
    setupScrollCue();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestResizeUpdate);
    window.addEventListener("load", requestUpdate);
    window.addEventListener("pageshow", requestUpdate);
    window.addEventListener("hashchange", () => scrollToHashTarget(window.location.hash, "auto"));
  };

  const initializePage = () => {
    stickySectionsController.setupTimelineRoutes();
    setupGoogleForms();
    settleInitialHashTarget();
    setupPageEvents();
    updatePageState();
  };

  initializePage();
})();
