(function () {
  const readNumberAttribute = (element, name, fallback = null) => {
    const value = Number(element.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  const createStickyCounter = counter => ({
    element: counter,
    target: readNumberAttribute(counter, "data-countup-to", 0)
  });

  const createTimelineRoute = path => ({
    path,
    length: 0
  });

  const createTimelineStop = stop => ({
    stop,
    at: readNumberAttribute(stop, "data-stop-at", 0)
  });

  const createStickySection = scene => ({
    section: scene.closest("section"),
    scene,
    scrollCueStartAt: readNumberAttribute(scene, "data-scroll-cue-start-at"),
    scrollCuePreviewOpacity: readNumberAttribute(scene, "data-scroll-cue-preview-opacity"),
    scrollCuePreviewTravel: readNumberAttribute(scene, "data-scroll-cue-preview-travel"),
    scrollCuePreviewScale: readNumberAttribute(scene, "data-scroll-cue-preview-scale"),
    scrollCueTarget: readNumberAttribute(scene, "data-scroll-cue-target"),
    scrollCueCompleteAt: readNumberAttribute(scene, "data-scroll-cue-complete-at"),
    cards: [...scene.querySelectorAll("[data-stickysection-card]")],
    counters: [...scene.querySelectorAll("[data-countup-to]")].map(createStickyCounter),
    routes: [...scene.querySelectorAll("[data-timeline-route]")].map(createTimelineRoute),
    stops: [...scene.querySelectorAll("[data-timeline-stop]")].map(createTimelineStop)
  });

  window.createStickySectionsController = ({
    reducedMotion,
    header,
    getRequestUpdate
  }) => {
    const stickySections = [...document.querySelectorAll("[data-stickysection-scene]")].map(createStickySection);
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const easeOutCubic = value => 1 - Math.pow(1 - value, 3);
    const parseCssNumber = value => Number.parseFloat(String(value).trim()) || 0;
    const canAnimateStickySections = () => !reducedMotion && window.innerWidth >= 1280;
    const getStickyPinTop = () => 112;
    const getStickyPinnedHeight = section =>
      section.scene.querySelector(".stickysection-pin")?.offsetHeight || 0;
    const getStickyCardStart = (section, cardIndex, entrySpan, step, isSingleCard) => {
      if (isSingleCard) {
        return Number.isFinite(section.scrollCueStartAt) ? section.scrollCueStartAt : -0.12;
      }

      if (cardIndex === 0) {
        return -entrySpan * 1.8;
      }

      return cardIndex * step * 0.9;
    };
    const getStickyCardProgress = (section, cardIndex, state) => {
      const start = getStickyCardStart(section, cardIndex, state.entrySpan, state.step, state.isSingleCard);
      const rawProgress = clamp((state.ratio - start) / state.entrySpan, 0, 1);

      return {
        start,
        progress: state.isSingleCard ? rawProgress : easeOutCubic(rawProgress)
      };
    };
    const getStickySectionMetrics = section => {
      const rect = section.scene.getBoundingClientRect();
      const pinTop = getStickyPinTop();
      const pinnedHeight = getStickyPinnedHeight(section);
      const total = Math.max(rect.height - pinnedHeight, 1);
      const passed = clamp(pinTop - rect.top, 0, total);
      const ratio = passed / total;
      const cardCount = section.cards.length;
      const step = 1 / cardCount;
      const isSingleCard = cardCount === 1;
      const entrySpan = isSingleCard ? 1.12 : Math.min(0.42, step * 1.22);

      return {
        rect,
        pinTop,
        pinnedHeight,
        total,
        passed,
        ratio,
        cardCount,
        step,
        isSingleCard,
        entrySpan,
        index: Math.min(cardCount - 1, Math.floor(ratio * cardCount))
      };
    };
    const getSceneProgress = scene => {
      const rect = scene.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const total = Math.max(rect.height + viewportHeight, 1);
      const passed = clamp(viewportHeight - rect.top, 0, total);
      return passed / total;
    };
    const getCounterProgress = scene => {
      const completionPoint = 0.94;
      return clamp(easeOutCubic(getSceneProgress(scene)) / completionPoint, 0, 1);
    };
    const getStickySectionState = section => {
      if (!section?.cards.length) return null;

      const metrics = getStickySectionMetrics(section);
      const starts = [];
      const progress = section.cards.map((card, cardIndex) => {
        const cardState = getStickyCardProgress(section, cardIndex, metrics);
        starts[cardIndex] = cardState.start;
        return cardState.progress;
      });
      const completionThreshold = section.scrollCueCompleteAt || (metrics.isSingleCard ? 0.985 : 0.999);

      return {
        ...metrics,
        starts,
        progress,
        isComplete: metrics.ratio >= completionThreshold || progress[metrics.cardCount - 1] >= completionThreshold,
        isLastCardActive: metrics.index >= metrics.cardCount - 1
      };
    };
    const syncStickySectionMotionState = () => {
      document.documentElement.classList.toggle("has-stickysection-motion", canAnimateStickySections());
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
    const fillStickySectionStaticState = () => {
      for (const section of stickySections) {
        for (const counter of section.counters || []) {
          counter.element.textContent = String(counter.target);
        }
        setTimelineMapReveal(section, 1);
        setConvergenceVisualProgress(section, 1);
      }
    };

    return {
      stickySections,
      canAnimateStickySections,
      getCurrentStickySection() {
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
      },
      getStickyAdvanceScrollTop(section) {
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
      },
      requestResizeUpdate() {
        resetStickySectionCards();
        syncStickySectionMotionState();

        getRequestUpdate()();
      },
      setupTimelineRoutes() {
        for (const section of stickySections) {
          for (const route of section.routes || []) {
            route.length = route.path.getTotalLength();
            route.path.style.strokeDasharray = `${route.length.toFixed(2)}`;
            route.path.style.strokeDashoffset = `${route.length.toFixed(2)}`;
          }
        }
      },
      update() {
        if (!stickySections.length) return;
        syncStickySectionMotionState();

        if (!canAnimateStickySections()) {
          resetStickySectionCards();
          fillStickySectionStaticState();
          return;
        }

        for (const section of stickySections) {
          if (!section.cards.length) continue;

          const state = getStickySectionMetrics(section);
          const singleCard = state.isSingleCard ? section.cards[0] : null;
          const singleCardHeight = singleCard?.offsetHeight || 0;
          const travel = state.isSingleCard
            ? section.scrollCuePreviewTravel || Math.max(140, window.innerHeight - state.pinTop - singleCardHeight)
            : 96;
          const cardProgresses = [];

          for (const [cardIndex, card] of section.cards.entries()) {
            const { progress } = getStickyCardProgress(section, cardIndex, state);
            cardProgresses[cardIndex] = progress;
            const y = (1 - progress) * travel;
            const scaleStart = state.isSingleCard
              ? section.scrollCuePreviewScale || 0.94
              : 0.94;
            const scale = scaleStart + progress * (1 - scaleStart);
            const opacityFloor = state.isSingleCard
              ? section.scrollCuePreviewOpacity || 0.22
              : 0.22;
            const opacity = opacityFloor + progress * (1 - opacityFloor);

            card.style.setProperty("--stickysection-card-y", `${y.toFixed(1)}px`);
            card.style.setProperty("--stickysection-card-scale", scale.toFixed(3));
            card.style.setProperty("--stickysection-card-opacity", opacity.toFixed(3));
            card.classList.toggle("is-active", cardIndex === state.index);
            card.classList.toggle("is-before", cardIndex < state.index);
            card.classList.toggle("is-after", cardIndex > state.index);

            const timelineItem = card.closest(".timeline-card");
            if (timelineItem) {
              timelineItem.classList.toggle("is-active", cardIndex === state.index);
              timelineItem.classList.toggle("is-before", cardIndex < state.index);
              timelineItem.classList.toggle("is-after", cardIndex > state.index);
            }
          }

          for (const [cardIndex, card] of section.cards.entries()) {
            const nextProgress = cardIndex < section.cards.length - 1 ? cardProgresses[cardIndex + 1] : 0;
            const lineTarget = card.closest(".timeline-card") || card;
            lineTarget.style.setProperty("--timeline-line-progress", nextProgress.toFixed(3));
          }

          const routeDelay = 0.12;
          const routeProgress = clamp((state.ratio - routeDelay) / (1 - routeDelay), 0, 1);
          setTimelineMapReveal(section, routeProgress);
          setConvergenceVisualProgress(section, clamp((state.ratio - 0.08) / 0.84, 0, 1));
          const counterProgress = getCounterProgress(section.scene);

          for (const counter of section.counters || []) {
            counter.element.textContent = String(Math.round(counter.target * counterProgress));
          }
        }
      }
    };
  };
})();
