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
  const stickySections = [...document.querySelectorAll("[data-stickysection-scene]")].map(scene => ({
    section: scene.closest("section"),
    scene,
    scrollCueStartAt: Number(scene.getAttribute("data-scroll-cue-start-at")),
    scrollCuePreviewOpacity: Number(scene.getAttribute("data-scroll-cue-preview-opacity")) || null,
    scrollCuePreviewTravel: Number(scene.getAttribute("data-scroll-cue-preview-travel")) || null,
    scrollCuePreviewScale: Number(scene.getAttribute("data-scroll-cue-preview-scale")) || null,
    scrollCueTarget: Number(scene.getAttribute("data-scroll-cue-target")) || null,
    scrollCueCompleteAt: Number(scene.getAttribute("data-scroll-cue-complete-at")) || null,
    cards: [...scene.querySelectorAll("[data-stickysection-card]")],
    counters: [...scene.querySelectorAll("[data-countup-to]")].map(counter => ({
      element: counter,
      target: Number(counter.getAttribute("data-countup-to")) || 0
    })),
    routes: [...scene.querySelectorAll("[data-timeline-route]")].map(path => ({
      path,
      length: 0
    })),
    stops: [...scene.querySelectorAll("[data-timeline-stop]")].map(stop => ({
      stop,
      at: Number(stop.getAttribute("data-stop-at")) || 0
    }))
  }));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeOutCubic = value => 1 - Math.pow(1 - value, 3);
  const parseCssNumber = value => Number.parseFloat(String(value).trim()) || 0;
  const canAnimateStickySections = () => !reducedMotion && window.innerWidth >= 1280;
  const getCounterProgress = scene => {
    const completionPoint = 0.94;
    return clamp(easeOutCubic(getSceneProgress(scene)) / completionPoint, 0, 1);
  };
  const getSceneProgress = scene => {
    const rect = scene.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    const total = Math.max(rect.height + viewportHeight, 1);
    const passed = clamp(viewportHeight - rect.top, 0, total);
    return passed / total;
  };
  const getStickySectionState = section => {
    if (!section?.cards.length) return null;

    const rect = section.scene.getBoundingClientRect();
    const pinTop = 112;
    const pinnedHeight =
      section.scene.querySelector(".stickysection-pin")?.offsetHeight || 0;
    const total = Math.max(rect.height - pinnedHeight, 1);
    const passed = clamp(pinTop - rect.top, 0, total);
    const ratio = passed / total;
    const cardCount = section.cards.length;
    const index = Math.min(cardCount - 1, Math.floor(ratio * cardCount));
    const step = 1 / cardCount;
    const isSingleCard = cardCount === 1;
    const entrySpan = isSingleCard ? 1.12 : Math.min(0.42, step * 1.22);
    const starts = [];
    const progress = section.cards.map((card, cardIndex) => {
      const start = isSingleCard
        ? Number.isFinite(section.scrollCueStartAt) ? section.scrollCueStartAt : -0.12
        : cardIndex === 0
          ? -entrySpan * 1.8
          : cardIndex * step * 0.9;
      starts[cardIndex] = start;
      const rawProgress = clamp((ratio - start) / entrySpan, 0, 1);
      return isSingleCard ? rawProgress : easeOutCubic(rawProgress);
    });
    const completionThreshold = section.scrollCueCompleteAt || (isSingleCard ? 0.985 : 0.999);

    return {
      pinTop,
      total,
      passed,
      ratio,
      step,
      index,
      entrySpan,
      starts,
      progress,
      cardCount,
      isComplete: ratio >= completionThreshold || progress[cardCount - 1] >= completionThreshold,
      isLastCardActive: index >= cardCount - 1
    };
  };
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
  const getCurrentStickySection = () => {
    const headerHeight = header?.offsetHeight || 0;
    const probeY = window.scrollY + headerHeight + 140;

    for (const stickySection of stickySections) {
      const section = stickySection.section;

      if (!section) continue;

      const start = section.offsetTop;
      const end = start + section.offsetHeight;

      if (probeY >= start && probeY < end) {
        return stickySection;
      }
    }

    return null;
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
    return clamp(targetTop, minTop, maxTop);
  };
  const getFooterScrollTop = () => {
    if (!siteFooter) return null;

    const headerHeight = header?.offsetHeight || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const minTop = Math.max(0, siteFooter.offsetTop - headerHeight);
    const maxTop = Math.max(minTop, document.documentElement.scrollHeight - viewportHeight);

    return clamp(minTop, 0, maxTop);
  };
  const getStickyAdvanceScrollTop = section => {
    const state = getStickySectionState(section);

    if (!state || state.isComplete) return null;
    if (state.isLastCardActive && state.cardCount > 1) return null;

    const nextCardIndex = Math.min(section.cards.length - 1, state.index + 1);
    const revealProgress = section.scrollCueTarget || (section.cards.length === 1 ? 0.985 : 0.72);
    const nextRatio = clamp(state.starts[nextCardIndex] + (state.entrySpan * revealProgress), 0, 1);
    const nextPassed = nextRatio * state.total;
    const sceneTop = section.scene.getBoundingClientRect().top + window.scrollY;
    const targetTop = sceneTop - state.pinTop + nextPassed;

    return Math.max(0, targetTop);
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

  const syncStickySectionMotionState = () => {
    document.documentElement.classList.toggle("has-stickysection-motion", canAnimateStickySections());
  };

  const setupTimelineRoutes = () => {
    for (const section of stickySections) {
      for (const route of section.routes || []) {
        route.length = route.path.getTotalLength();
        route.path.style.strokeDasharray = `${route.length.toFixed(2)}`;
        route.path.style.strokeDashoffset = `${route.length.toFixed(2)}`;
      }
    }
  };

  const setTimelineMapReveal = (section, progress) => {
    for (const route of section.routes || []) {
      const dashOffset = route.length * (1 - progress);
      route.path.style.strokeDashoffset = `${dashOffset.toFixed(2)}`;
    }

    for (const stop of section.stops || []) {
      stop.stop.classList.toggle("is-reached", progress >= stop.at);
    }
  };

  const setConvergenceVisualProgress = (section, progress) => {
    const visual = section.scene.querySelector("[data-convergence-visual]");
    if (!visual) return;

    const eased = easeOutCubic(progress);
    const cluster = 1 - eased;
    const ring = clamp((eased - 0.16) / 0.84, 0, 1);
    const rise = clamp((eased - 0.12) / 0.5, 0, 1);

    visual.style.setProperty("--convergence-progress", eased.toFixed(3));
    visual.style.setProperty("--convergence-cluster", cluster.toFixed(3));
    visual.style.setProperty("--convergence-ring-opacity", ring.toFixed(3));
    visual.style.setProperty("--convergence-rise", rise.toFixed(3));

    const bounds = visual.getBoundingClientRect();
    const lightX = bounds.width * -0.28;
    const lightY = bounds.height * -0.42;
    const shadowLength = bounds.width * 0.28;

    for (const figure of visual.querySelectorAll("[data-convergence-figure]")) {
      const styles = getComputedStyle(figure);
      const wrap = figure.querySelector(".figure-silhouette-wrap");
      const wrapStyles = wrap ? getComputedStyle(wrap) : styles;
      const tableX = parseCssNumber(styles.getPropertyValue("--table-x"));
      const tableY = parseCssNumber(styles.getPropertyValue("--table-y"));
      const startX = parseCssNumber(styles.getPropertyValue("--person-start-x"));
      const startY = parseCssNumber(styles.getPropertyValue("--person-start-y"));
      const endX = parseCssNumber(styles.getPropertyValue("--person-end-x"));
      const endY = parseCssNumber(styles.getPropertyValue("--person-end-y"));
      const leftFootX = parseCssNumber(
        wrapStyles.getPropertyValue("--figure-shadow-left-x") ||
        wrapStyles.getPropertyValue("--figure-foot-x")
      );
      const leftFootY = parseCssNumber(
        wrapStyles.getPropertyValue("--figure-shadow-left-y") ||
        wrapStyles.getPropertyValue("--figure-foot-y")
      );
      const rightFootX = parseCssNumber(
        wrapStyles.getPropertyValue("--figure-shadow-right-x") ||
        String(leftFootX)
      );
      const rightFootY = parseCssNumber(
        wrapStyles.getPropertyValue("--figure-shadow-right-y") ||
        String(leftFootY)
      );
      const personX = ((tableX + startX) * cluster) + (endX * eased);
      const personY = ((tableY + startY) * cluster) + (endY * eased);
      const leftX = personX + leftFootX;
      const leftY = personY + leftFootY;
      const rightX = personX + rightFootX;
      const rightY = personY + rightFootY;
      const centerX = (leftX + rightX) / 2;
      const centerY = (leftY + rightY) / 2;
      const lightVectorX = centerX - lightX;
      const lightVectorY = centerY - lightY;
      const lightVectorLength = Math.max(Math.hypot(lightVectorX, lightVectorY), 1);
      const tailX = centerX + (lightVectorX / lightVectorLength) * shadowLength;
      const tailY = centerY + (lightVectorY / lightVectorLength) * shadowLength;
      const leftAngle = Math.atan2(tailY - leftY, tailX - leftX) * (180 / Math.PI);
      const rightAngle = Math.atan2(tailY - rightY, tailX - rightX) * (180 / Math.PI);

      figure.style.setProperty("--figure-shadow-left-angle", `${leftAngle.toFixed(2)}deg`);
      figure.style.setProperty("--figure-shadow-right-angle", `${rightAngle.toFixed(2)}deg`);
    }
  };

  const resetStickySectionCards = () => {
    for (const section of stickySections) {
      for (const card of section.cards) {
        card.classList.remove("is-before", "is-after");
        card.classList.add("is-active");
        card.style.removeProperty("--stickysection-card-y");
        card.style.removeProperty("--stickysection-card-scale");
        card.style.removeProperty("--stickysection-card-opacity");
        card.style.removeProperty("--timeline-line-progress");

        const timelineItem = card.closest(".timeline-card");
        if (timelineItem) {
          timelineItem.classList.remove("is-before", "is-after");
          timelineItem.classList.add("is-active");
          timelineItem.style.removeProperty("--timeline-line-progress");
        }
      }

      for (const counter of section.counters || []) {
        counter.element.textContent = reducedMotion ? String(counter.target) : "0";
      }

      setTimelineMapReveal(section, 0);
      setConvergenceVisualProgress(section, 0);
    }
  };

  const updateStickySectionCards = () => {
    if (!stickySections.length) return;
    syncStickySectionMotionState();

    if (!canAnimateStickySections()) {
      resetStickySectionCards();
      for (const section of stickySections) {
        for (const counter of section.counters || []) {
          counter.element.textContent = String(counter.target);
        }
        setTimelineMapReveal(section, 1);
        setConvergenceVisualProgress(section, 1);
      }
      return;
    }

    for (const section of stickySections) {
      if (!section.cards.length) continue;

      const rect = section.scene.getBoundingClientRect();
      const pinTop = 112;
      const pinnedHeight =
        section.scene.querySelector(".stickysection-pin")?.offsetHeight || 0;
      const total = Math.max(rect.height - pinnedHeight, 1);
      const passed = clamp(pinTop - rect.top, 0, total);
      const ratio = passed / total;
      const index = Math.min(section.cards.length - 1, Math.floor(ratio * section.cards.length));
      const isSingleCard = section.cards.length === 1;
      const step = 1 / section.cards.length;
      const singleCard = isSingleCard ? section.cards[0] : null;
      const singleCardHeight = singleCard?.offsetHeight || 0;
      const travel = isSingleCard
        ? section.scrollCuePreviewTravel || Math.max(140, window.innerHeight - pinTop - singleCardHeight)
        : 96;
      const entrySpan = isSingleCard ? 1.12 : Math.min(0.42, step * 1.22);
      const cardProgresses = [];

      for (const [cardIndex, card] of section.cards.entries()) {
        const start = isSingleCard
          ? -0.12
          : cardIndex === 0
            ? -entrySpan * 1.8
            : cardIndex * step * 0.9;
        const rawProgress = clamp((ratio - start) / entrySpan, 0, 1);
        const progress = isSingleCard
          ? rawProgress
          : easeOutCubic(rawProgress);
        cardProgresses[cardIndex] = progress;
        const y = (1 - progress) * travel;
        const scaleStart = isSingleCard
          ? section.scrollCuePreviewScale || 0.94
          : 0.94;
        const scale = scaleStart + progress * (1 - scaleStart);
        const opacityFloor = isSingleCard
          ? section.scrollCuePreviewOpacity || 0.22
          : 0.22;
        const opacity = opacityFloor + progress * (1 - opacityFloor);

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

      const routeDelay = 0.12;
      const routeProgress = clamp((ratio - routeDelay) / (1 - routeDelay), 0, 1);
      setTimelineMapReveal(section, routeProgress);
      setConvergenceVisualProgress(section, clamp((ratio - 0.08) / 0.84, 0, 1));
      const counterProgress = getCounterProgress(section.scene);

      for (const counter of section.counters || []) {
        counter.element.textContent = String(Math.round(counter.target * counterProgress));
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

    if (scrollCue) {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const documentHeight = document.documentElement.scrollHeight || 0;
      const bottomThreshold = 48;
      const isNearBottom = y + viewportHeight >= documentHeight - bottomThreshold;
      scrollCue.classList.toggle("is-hidden", isNearBottom);
    }

    updateStickySectionCards();
  };

  let ticking = false;
  let resizeTimeout = null;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  const requestResizeUpdate = () => {
    // Always clear sticky inline state during resize so repeated manual dragging
    // cannot leave cards in a mixed desktop/tablet/mobile visual state.
    resetStickySectionCards();
    syncStickySectionMotionState();

    requestUpdate();

    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      resetStickySectionCards();
      syncStickySectionMotionState();
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

  setupTimelineRoutes();
  setupGoogleForms();
  settleInitialHashTarget();

  document.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');

    if (!link) return;

    const hash = link.getAttribute("href");

    if (!getHashTarget(hash)) return;

    event.preventDefault();
    history.pushState(null, "", hash);
    scrollToHashTarget(hash, "smooth");
  });

  if (scrollCue) {
    scrollCue.addEventListener("click", () => {
      const activeStickySection = canAnimateStickySections() ? getCurrentStickySection() : null;
      const stickyAdvanceTop = activeStickySection ? getStickyAdvanceScrollTop(activeStickySection) : null;
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
  }

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestResizeUpdate);
  window.addEventListener("load", requestUpdate);
  window.addEventListener("pageshow", requestUpdate);
  window.addEventListener("hashchange", () => scrollToHashTarget(window.location.hash, "auto"));
})();
