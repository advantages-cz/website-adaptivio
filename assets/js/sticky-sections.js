(function () {
  window.createStickySectionsController = ({
    reducedMotion,
    header,
    getRequestUpdate
  }) => {
    const stickySections = [...document.querySelectorAll("[data-stickysection-scene]")].map(window.createStickySection);
    const runtime = window.createStickySectionsRuntime({
      reducedMotion,
      stickySections
    });

    return {
      stickySections,
      canAnimateStickySections: runtime.canAnimateStickySections,
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
        const state = runtime.getStickySectionState(section);

        if (!state || state.isComplete) return null;
        if (state.isLastCardActive && state.cardCount > 1) return null;

        const nextCardIndex = Math.min(section.cards.length - 1, state.index + 1);
        const revealProgress = section.scrollCueTarget || (section.cards.length === 1 ? 0.985 : 0.72);
        const nextRatio = Math.min(1, Math.max(0, state.starts[nextCardIndex] + (state.entrySpan * revealProgress)));
        const nextPassed = nextRatio * state.total;
        const sceneTop = section.scene.getBoundingClientRect().top + window.scrollY;
        const targetTop = sceneTop - state.pinTop + nextPassed;

        return Math.max(0, targetTop);
      },
      requestResizeUpdate() {
        runtime.resetStickySectionCards();
        runtime.syncStickySectionMotionState();
        getRequestUpdate()();
      },
      setupTimelineRoutes: runtime.setupTimelineRoutes,
      update() {
        if (!stickySections.length) return;
        runtime.syncStickySectionMotionState();

        if (!runtime.canAnimateStickySections()) {
          runtime.resetStickySectionCards();
          runtime.fillStickySectionStaticState();
          return;
        }

        for (const section of stickySections) {
          if (!section.cards.length) continue;

          const state = runtime.getStickySectionMetrics(section);
          const singleCard = state.isSingleCard ? section.cards[0] : null;
          const singleCardHeight = singleCard?.offsetHeight || 0;
          const travel = state.isSingleCard
            ? section.scrollCuePreviewTravel || Math.max(140, window.innerHeight - state.pinTop - singleCardHeight)
            : 96;
          const cardProgresses = [];

          for (const [cardIndex, card] of section.cards.entries()) {
            cardProgresses[cardIndex] = runtime.updateStickySectionCard(section, state, card, cardIndex, travel);
          }

          runtime.updateStickySectionLines(section, cardProgresses);
          runtime.updateStickySectionVisuals(section, state);
          const counterProgress = runtime.getCounterProgress(section.scene);

          for (const counter of section.counters || []) {
            runtime.updateStickySectionCounter(counter, counterProgress);
          }
        }
      }
    };
  };
})();
