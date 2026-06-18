(function () {
  const MOBILE_BREAKPOINT = 767;
  const ANCHOR_OFFSET = 8;
  const NEXT_SECTION_OFFSET = 24;

  const createPageNavigation = ({
    header,
    reducedMotion,
    articleSections,
    siteFooter,
    scrollToTop,
    requestUpdate
  }) => {
    const getHeaderHeight = () => header?.offsetHeight || 0;
    const getViewportHeight = () => window.innerHeight || document.documentElement.clientHeight || 0;

    const getNextSection = () => {
      const offset = getHeaderHeight() + NEXT_SECTION_OFFSET;
      const currentY = window.scrollY;

      return articleSections.find(section => section.offsetTop > currentY + offset + ANCHOR_OFFSET) || null;
    };

    const getNextSectionAfter = currentSection => {
      if (!currentSection) return getNextSection();

      const currentIndex = articleSections.indexOf(currentSection);

      if (currentIndex === -1) return getNextSection();

      return articleSections[currentIndex + 1] || null;
    };

    const getSectionScrollTop = section => {
      const headerHeight = getHeaderHeight();
      const viewportHeight = getViewportHeight();
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

      if (window.innerWidth <= MOBILE_BREAKPOINT) {
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

      const headerHeight = getHeaderHeight();
      const viewportHeight = getViewportHeight();
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
      const headerHeight = getHeaderHeight();
      const section = target.matches("article > section")
        ? target
        : target.closest("article > section");

      if (section && !section.classList.contains("response-form-section")) {
        return getSectionScrollTop(section);
      }

      const targetTop = target.getBoundingClientRect().top + window.scrollY;

      if (section?.classList.contains("response-form-section")) {
        const mobileFormOffset = window.innerWidth <= MOBILE_BREAKPOINT
          ? Math.min(28, Math.max(0, window.innerHeight * 0.015))
          : 0;

        return Math.max(0, targetTop - headerHeight - ANCHOR_OFFSET + mobileFormOffset);
      }

      return Math.max(0, targetTop - headerHeight - ANCHOR_OFFSET);
    };

    const scrollToHashTarget = (hash = window.location.hash, behavior = "auto") => {
      const target = getHashTarget(hash);

      if (!target) return false;

      scrollToTop(getAnchorScrollTop(target), reducedMotion ? "auto" : behavior);
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

    return {
      getFooterScrollTop,
      getNextSection,
      getNextSectionAfter,
      getSectionScrollTop,
      scrollToHashTarget,
      settleInitialHashTarget,
      setupAnchorLinks
    };
  };

  window.createPageNavigation = createPageNavigation;
})();
