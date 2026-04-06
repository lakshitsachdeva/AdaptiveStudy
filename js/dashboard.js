(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    if (
      typeof window.CognitiveEngine !== "function" ||
      typeof window.UIAdapter !== "function" ||
      !window.StudyContent ||
      !window.SessionAnalytics ||
      typeof window.OnboardingTour !== "function"
    ) {
      return;
    }

    const engine = new window.CognitiveEngine();
    const ui = new window.UIAdapter();
    const content = window.StudyContent;
    const analytics = window.SessionAnalytics;
    const scoreHistory = [];

    const body = document.body;
    const layoutBackdrop = document.getElementById("layout-backdrop");
    const timerDisplay = document.getElementById("session-timer");
    const notesField = document.getElementById("study-notes");
    const chatSection = document.getElementById("chat-section");
    const demoToggleButton = document.getElementById("btn-demo");
    const demoBadge = document.getElementById("demo-badge");
    const navbarMenuButton = document.getElementById("btn-navbar-menu");
    const navbarOverflowMenu = document.getElementById("navbar-overflow-menu");
    const navbarSidebarButton = document.getElementById("btn-navbar-sidebar");
    const navbarPanelButton = document.getElementById("btn-navbar-panel");
    const shortcutModal = document.getElementById("shortcut-modal");
    const researchOverlay = document.getElementById("research-overlay");
    const quickSheet = document.getElementById("quick-actions-sheet");
    const quickSheetFab = document.getElementById("fab-quick-actions");
    const panelTabButtons = Array.from(document.querySelectorAll(".insights-tab-button"));
    const rightPanelContent = document.getElementById("right-panel-content");
    const welcomeModal = document.getElementById("welcome-modal");
    const nameInput = document.getElementById("user-name-input");
    const startSessionButton = document.getElementById("btn-start-session");
    const skipNameButton = document.getElementById("btn-skip-name");
    const sessionSummaryOverlay = document.getElementById("session-summary-overlay");
    const sessionSummaryTitle = document.getElementById("session-summary-title");
    const sessionSummarySubtitle = document.getElementById("session-summary-subtitle");
    const endSessionButton = document.getElementById("btn-end-session");
    const summaryCloseButton = document.getElementById("btn-close-session-summary");
    const summaryExportButton = document.getElementById("btn-summary-export");
    const startNewSessionButton = document.getElementById("btn-start-new-session");
    const resetSessionButton = document.getElementById("btn-reset-session");

    let sessionSeconds = 0;
    let breakSuggestionShown = false;
    let timerIntervalId = null;
    let demoIntervalId = null;
    let demoModeActive = false;
    let demoStartedAt = 0;
    let lastDemoPhase = null;
    let userName = loadUserName();
    let sessionEnded = false;
    let isResetting = false;
    let calibrationUiResolved = false;
    let tour = null;
    let chat = null;
    const isLocal = isLocalEnvironment();
    const saveNotesDebounced = debounce((value) => {
      try {
        window.localStorage.setItem("adaptivestudy-notes", value);
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to save notes:", error);
      }
    }, 1000);

    engine.onCalibrationComplete((data) => {
      if (calibrationUiResolved) {
        return;
      }

      calibrationUiResolved = true;
      ui.showCalibrationState(100, true);
      ui.showToast("Calibrated to your interaction style", "success");
      analytics.calibrated = true;
      analytics.logEvent("calibration_complete", data);
    });

    restoreNotes();
    updateSessionTimer();
    startSessionTimer();
    wireButtons();
    wireTopicPills();
    wireNotes();
    wireKeyboardShortcuts();
    wireCustomEvents();
    wirePanelTabs();
    updateTopicPillCounts();
    syncPanelButtonStates();
    observeLayoutState();
    initializeWelcome();
    ui.updateMasteryBars(content.getSubjectMastery());
    analytics.logEvent("card_seen", { subject: content.getCurrentCard()?.subject || null });
    setPanelView("load");

    document.getElementById("btn-tour")?.addEventListener("click", () => {
      ensureTour()?.start();
      closeNavbarMenu();
    });

    if (chatSection && isLocal) {
      chatSection.hidden = true;
    }

    window.addEventListener("resize", syncPanelButtonStates);
    window.addEventListener("scroll", () => {
      document.getElementById("navbar")?.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });
    window.addEventListener("beforeunload", () => {
      if (!notesField || isResetting) {
        return;
      }

      try {
        window.localStorage.setItem("adaptivestudy-notes", notesField.value);
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to flush notes:", error);
      }
    });

    document.getElementById("btn-export-report")?.addEventListener("click", () => {
      exportSessionReport();
    });

    document.getElementById("btn-shortcuts")?.addEventListener("click", () => {
      closeNavbarMenu();
      if (shortcutModal) {
        shortcutModal.hidden = false;
      }
    });

    document.getElementById("btn-close-shortcuts")?.addEventListener("click", () => {
      if (shortcutModal) {
        shortcutModal.hidden = true;
      }
    });

    document.getElementById("btn-close-research")?.addEventListener("click", () => {
      if (researchOverlay) {
        researchOverlay.hidden = true;
      }
    });

    document.getElementById("btn-print-research")?.addEventListener("click", () => {
      window.print();
    });

    window.AdaptiveStudyDashboard = {
      engine,
      ui,
      content,
      analytics,
      get tour() {
        return tour;
      },
      get chat() {
        return chat;
      }
    };

    runWhenIdle(() => {
      if (!demoModeActive && !sessionEnded) {
        startRealPolling();
      }
    }, 1200);

    window.setTimeout(() => {
      if (userName && ensureTour()?.shouldShow()) {
        ensureTour().start();
      }
    }, 3000);

    if (!isLocal && typeof window.AdaptiveStudyChatbot === "function") {
      window.setTimeout(() => {
        chat = new window.AdaptiveStudyChatbot();
      }, 5000);
    }

    function observeLayoutState() {
      const observer = new MutationObserver(() => {
        syncPanelButtonStates();
      });

      observer.observe(body, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    function isLocalEnvironment() {
      const hostname = window.location.hostname;
      return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";
    }

    function startSessionTimer() {
      if (timerIntervalId !== null) {
        window.clearInterval(timerIntervalId);
      }

      timerIntervalId = window.setInterval(() => {
        if (sessionEnded) {
          return;
        }

        sessionSeconds += 1;
        updateSessionTimer();

        if (!breakSuggestionShown && sessionSeconds >= 25 * 60) {
          breakSuggestionShown = true;
          timerDisplay?.classList.add("timer-warning");
          ui.showToast("Pomodoro break suggested", "calm");
          analytics.logEvent("pomodoro_alert");
        }
      }, 1000);
    }

    function updateSessionTimer() {
      if (!timerDisplay) {
        return;
      }

      const minutes = Math.floor(sessionSeconds / 60);
      const seconds = sessionSeconds % 60;
      timerDisplay.textContent = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }

    function startRealPolling() {
      engine.startPolling((metrics) => {
        if (metrics.calibrating && !calibrationUiResolved) {
          ui.showCalibrationState(Number(metrics.progress || 0), false);
        }

        applyMetrics(metrics);
      }, 2000);
    }

    function applyMetrics(metrics) {
      if (sessionEnded) {
        return;
      }

      if (!calibrationUiResolved && !metrics.calibrating && engine.calibrationComplete) {
        calibrationUiResolved = true;
        ui.showCalibrationState(100, true);
        analytics.calibrated = true;
        analytics.logEvent("calibration_complete", {
          baselines: null,
          confidence: metrics.confidence ?? null,
          resolvedBy: "engine-complete"
        });
      }

      body.dataset.loadState = metrics.state || "medium";
      ui.updateMetricBars(metrics);
      ui.updateLoadGauge(metrics.composite);
      ui.updateLoadGaugeColor(metrics.composite);
      ui.updateStatusBar(metrics.state);
      ui.transitionToMode(metrics.state);
      content.adaptToLoad(metrics.state);

      scoreHistory.push(metrics.composite);
      if (scoreHistory.length > 30) {
        scoreHistory.shift();
      }

      ui.updateSparkline(scoreHistory);
      analytics.logLoadSample(metrics.composite, metrics.state);
      const stats = analytics.getStats();
      ui.updateSessionStats(stats);
      ui.updateResearchOverlay(Object.assign({}, stats, content.getSessionSummary()));
      ui.updateConfidence(metrics.confidence ?? engine.getConfidence());
    }

    function wireButtons() {
      document.getElementById("btn-flip")?.addEventListener("click", () => content.flipCard());
      document.getElementById("btn-learned")?.addEventListener("click", () => content.markLearned());
      document.getElementById("btn-review")?.addEventListener("click", () => content.markReview());
      document.getElementById("btn-skip")?.addEventListener("click", () => content.nextCard());
      document.getElementById("btn-toggle-sidebar")?.addEventListener("click", toggleSidebar);
      document.getElementById("btn-toggle-panel")?.addEventListener("click", togglePanel);
      navbarSidebarButton?.addEventListener("click", toggleSidebar);
      navbarPanelButton?.addEventListener("click", togglePanel);
      document.getElementById("btn-mobile-menu")?.addEventListener("click", toggleSidebar);
      document.getElementById("btn-mobile-panel")?.addEventListener("click", togglePanel);
      document.getElementById("btn-sheet-flip")?.addEventListener("click", () => content.flipCard());
      document.getElementById("btn-sheet-skip")?.addEventListener("click", () => content.nextCard());
      document.getElementById("btn-sheet-demo")?.addEventListener("click", toggleDemoMode);
      endSessionButton?.addEventListener("click", endSession);
      summaryCloseButton?.addEventListener("click", () => {
        if (sessionSummaryOverlay) {
          sessionSummaryOverlay.hidden = true;
        }
      });
      summaryExportButton?.addEventListener("click", exportSessionReport);
      startNewSessionButton?.addEventListener("click", () => {
        window.location.reload();
      });
      startSessionButton?.addEventListener("click", saveUserNameFromInput);
      skipNameButton?.addEventListener("click", skipNameForNow);
      resetSessionButton?.addEventListener("click", () => {
        closeNavbarMenu();
        resetEverything();
      });

      demoToggleButton?.addEventListener("click", () => {
        closeNavbarMenu();
        toggleDemoMode();
      });
      navbarMenuButton?.addEventListener("click", toggleNavbarMenu);

      quickSheetFab?.addEventListener("click", () => {
        if (!quickSheet) {
          return;
        }

        const open = quickSheet.hidden;
        quickSheet.hidden = !open;
        quickSheetFab.setAttribute("aria-expanded", String(open));
        quickSheetFab.textContent = open ? "✕" : "☰";
      });

      layoutBackdrop?.addEventListener("click", () => {
        closeCompactPanels();
        syncPanelButtonStates();
      });

      document.addEventListener("click", (event) => {
        if (!navbarOverflowMenu || !navbarMenuButton) {
          return;
        }

        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        if (!navbarOverflowMenu.contains(target) && !navbarMenuButton.contains(target)) {
          closeNavbarMenu();
        }
      });
    }

    function wireTopicPills() {
      document.querySelectorAll(".topic-pill-button").forEach((button) => {
        button.addEventListener("click", () => {
          const subject = button.dataset.topic || "";
          content.filterBySubject(subject === "All" ? null : subject);
          if (isCompactViewport()) {
            closeCompactPanels();
            syncPanelButtonStates();
          }
        });
      });

      document.querySelectorAll(".progress-ring-button[data-subject]").forEach((button) => {
        button.addEventListener("click", () => {
          const subject = button.dataset.subject || "";
          content.filterBySubject(subject || null);
          if (isCompactViewport()) {
            closeCompactPanels();
            syncPanelButtonStates();
          }
        });
      });
    }

    function wireNotes() {
      if (!notesField) {
        return;
      }

      notesField.addEventListener("input", () => {
        saveNotesDebounced(notesField.value);
      });
    }

    function restoreNotes() {
      if (!notesField) {
        return;
      }

      try {
        const savedNotes = window.localStorage.getItem("adaptivestudy-notes");
        if (savedNotes) {
          notesField.value = savedNotes;
        }
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to restore notes:", error);
      }
    }

    function wireKeyboardShortcuts() {
      document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key.toLowerCase() === "r") {
          event.preventDefault();
          if (researchOverlay) {
            researchOverlay.hidden = !researchOverlay.hidden;
          }
          return;
        }

        if (event.key === "?") {
          event.preventDefault();
          if (shortcutModal) {
            shortcutModal.hidden = false;
          }
          return;
        }

        if (event.key === "Escape") {
          closeOverlays();
          return;
        }

        if (event.key === "e" || event.key === "E") {
          if (!shouldIgnoreShortcut(event)) {
            event.preventDefault();
            endSession();
          }
          return;
        }

        if (shouldIgnoreShortcut(event)) {
          return;
        }

        if (event.code === "Space") {
          event.preventDefault();
          content.flipCard();
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          content.nextCard();
          return;
        }

        if (event.key === "l" || event.key === "L") {
          event.preventDefault();
          content.markLearned();
          return;
        }

        if (event.key === "r" || event.key === "R") {
          event.preventDefault();
          content.markReview();
          return;
        }

        if (event.key === "d" || event.key === "D") {
          event.preventDefault();
          toggleDemoMode();
        }
      });

      document.querySelectorAll(".conf-btn").forEach((button) => {
        button.addEventListener("click", () => {
          const card = content.getCurrentCard();
          const rating = parseInt(button.dataset.confidence || "0", 10);

          if (!card || !rating) {
            return;
          }

          content.recordConfidence(card.id, rating);
          analytics.logEvent("confidence_rated", { cardId: card.id, rating });
          content.nextCard();
        });
      });
    }

    function wirePanelTabs() {
      panelTabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          setPanelView(button.dataset.panelView || "load");
        });
      });
    }

    function wireCustomEvents() {
      window.addEventListener("adaptivestudy:card-rendered", (event) => {
        const card = event.detail?.card;

        if (!card) {
          return;
        }

        analytics.logEvent("card_seen", {
          cardId: card.id,
          subject: card.subject,
          difficulty: card.difficulty
        });
        ui.updateMasteryBars(content.getSubjectMastery());
      });

      window.addEventListener("adaptivestudy:card-learned", (event) => {
        const card = event.detail?.card;
        if (card) {
          analytics.logEvent("card_learned", { cardId: card.id });
          ui.updateMasteryBars(content.getSubjectMastery());
        }
      });

      window.addEventListener("adaptivestudy:card-review", (event) => {
        const card = event.detail?.card;
        if (card) {
          analytics.logEvent("card_review", { cardId: card.id });
          ui.updateMasteryBars(content.getSubjectMastery());
        }
      });

      window.addEventListener("adaptivestudy:confidence-recorded", () => {
        ui.updateMasteryBars(content.getSubjectMastery());
      });
    }

    function shouldIgnoreShortcut(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return false;
      }

      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      );
    }

    function updateTopicPillCounts() {
      const counts = {};

      (window.FLASHCARD_DECK || []).forEach((card) => {
        counts[card.subject] = (counts[card.subject] || 0) + 1;
      });

      document.querySelectorAll(".topic-pill-button").forEach((button) => {
        const subject = button.dataset.topic || "";
        const count = subject === "All" ? (window.FLASHCARD_DECK || []).length : counts[subject] || 0;
        const countBadge = button.querySelector(".pill-count");

        if (countBadge) {
          countBadge.textContent = String(count);
        }
      });
    }

    function toggleDemoMode() {
      if (demoModeActive) {
        stopDemoMode();
      } else {
        startDemoMode();
      }
    }

    function startDemoMode() {
      demoModeActive = true;
      demoStartedAt = Date.now();
      lastDemoPhase = null;
      engine.stopPolling();
      engine.setDemoMode(true);
      clearDemoTimer();
      setDemoUiState(true);
      analytics.logEvent("demo_mode_start");

      applyDemoPhaseEffects(0);
      applyMetrics(buildDemoMetrics(0));

      demoIntervalId = window.setInterval(() => {
        const elapsed = Date.now() - demoStartedAt;
        const elapsedSeconds = elapsed / 1000;
        applyDemoPhaseEffects(elapsedSeconds);
        applyMetrics(buildDemoMetrics(elapsedSeconds));

        if (elapsed >= 20000) {
          stopDemoMode();
          ui.showToast("Demo complete — try interacting normally now!", "success");
          analytics.logEvent("demo_mode_end", { duration: 20000 });
        }
      }, 1000);
    }

    function stopDemoMode() {
      demoModeActive = false;
      clearDemoTimer();
      setDemoUiState(false);
      engine.setDemoMode(false);
      startRealPolling();
    }

    function clearDemoTimer() {
      if (demoIntervalId !== null) {
        window.clearInterval(demoIntervalId);
        demoIntervalId = null;
      }
    }

    function setDemoUiState(active) {
      demoToggleButton?.setAttribute("aria-pressed", String(active));
      if (demoToggleButton) {
        demoToggleButton.textContent = active ? "Stop Demo" : "Demo Mode";
      }

      if (demoBadge) {
        demoBadge.hidden = !active;
        demoBadge.classList.toggle("is-blinking", active);
      }
    }

    function buildDemoMetrics(elapsedSeconds) {
      const composite = clamp(getDemoComposite(elapsedSeconds), 0, 100);
      const state = getStateFromScore(composite);

      return {
        cursorEntropy: clamp(composite * 0.82 + Math.sin(elapsedSeconds * 0.9) * 4, 0, 100),
        hesitationIndex: clamp(composite * 1.02 + Math.cos(elapsedSeconds * 0.8 + 0.4) * 3, 0, 100),
        errorRate: clamp(composite * 0.64 + Math.sin(elapsedSeconds * 0.7 + 1.2) * 2, 0, 100),
        scrollRhythm: clamp(composite * 0.76 + Math.cos(elapsedSeconds * 0.6 + 2.2) * 3, 0, 100),
        composite: Math.round(composite),
        state
      };
    }

    function applyDemoPhaseEffects(elapsedSeconds) {
      const phase = getDemoPhase(elapsedSeconds);

      if (phase === lastDemoPhase) {
        return;
      }

      lastDemoPhase = phase;

      if (phase === 1) {
        console.log("[Demo] Phase 1: Baseline — normal interaction");
      } else if (phase === 2) {
        console.log("[Demo] Phase 2: Load rising — sensors detecting stress signals");
        ui.showToast("Load rising — try typing or moving quickly", "info");
      } else if (phase === 3) {
        console.log("[Demo] Phase 3: Overload — Calm Mode activating...");
        ui.showToast("Overload detected — entering Calm Mode", "calm");
      } else if (phase === 4) {
        console.log("[Demo] Phase 4: Sustained overload — interface fully simplified");
      } else if (phase === 5) {
        console.log("[Demo] Phase 5: Recovery — restoring full interface");
        ui.showToast("Recovering — restoring Focus Mode", "success");
      }
    }

    function getDemoPhase(elapsedSeconds) {
      if (elapsedSeconds < 3) return 1;
      if (elapsedSeconds < 8) return 2;
      if (elapsedSeconds < 13) return 3;
      if (elapsedSeconds < 17) return 4;
      return 5;
    }

    function getDemoComposite(elapsedSeconds) {
      if (elapsedSeconds <= 3) {
        return 20;
      }

      if (elapsedSeconds <= 8) {
        return easeInOut(20, 48, (elapsedSeconds - 3) / 5);
      }

      if (elapsedSeconds <= 13) {
        return easeInOut(48, 82, (elapsedSeconds - 8) / 5);
      }

      if (elapsedSeconds <= 17) {
        return 82;
      }

      if (elapsedSeconds <= 20) {
        return easeInOut(82, 25, (elapsedSeconds - 17) / 3);
      }

      return 25;
    }

    function easeInOut(start, end, t) {
      const safeT = clamp(t, 0, 1);
      const eased = safeT < 0.5 ? 2 * safeT * safeT : -1 + (4 - 2 * safeT) * safeT;
      return start + (end - start) * eased;
    }

    function getStateFromScore(score) {
      if (score <= 33) return "low";
      if (score <= 66) return "medium";
      return "high";
    }

    function toggleSidebar() {
      if (isCompactViewport()) {
        const isOpen = !body.classList.contains("sidebar-open");
        body.classList.toggle("sidebar-open", isOpen);
        if (isOpen) {
          body.classList.remove("right-panel-open");
        }
      } else {
        body.classList.toggle("sidebar-hidden");
      }
      syncPanelButtonStates();
    }

    function togglePanel() {
      if (isCompactViewport()) {
        const isOpen = !body.classList.contains("right-panel-open");
        body.classList.toggle("right-panel-open", isOpen);
        if (isOpen) {
          body.classList.remove("sidebar-open");
        }
      } else {
        body.classList.toggle("panel-hidden");
      }
      syncPanelButtonStates();
    }

    function isCompactViewport() {
      return window.matchMedia("(max-width: 899px)").matches;
    }

    function syncPanelButtonStates() {
      const calmModeActive = body.classList.contains("calm-mode");
      const sidebarExpanded = isCompactViewport()
        ? body.classList.contains("sidebar-open")
        : !calmModeActive && !body.classList.contains("sidebar-hidden");
      const panelExpanded = isCompactViewport()
        ? body.classList.contains("right-panel-open")
        : !calmModeActive && !body.classList.contains("panel-hidden");

      document.getElementById("btn-toggle-sidebar")?.setAttribute("aria-expanded", String(sidebarExpanded));
      document.getElementById("btn-mobile-menu")?.setAttribute("aria-expanded", String(sidebarExpanded));
      navbarSidebarButton?.setAttribute("aria-expanded", String(sidebarExpanded));
      document.getElementById("btn-toggle-panel")?.setAttribute("aria-expanded", String(panelExpanded));
      document.getElementById("btn-mobile-panel")?.setAttribute("aria-expanded", String(panelExpanded));
      navbarPanelButton?.setAttribute("aria-expanded", String(panelExpanded));

      setToggleButtonState(
        document.getElementById("btn-toggle-sidebar"),
        sidebarExpanded,
        "Hide",
        "Show",
        "sidebar"
      );
      setToggleButtonState(
        document.getElementById("btn-toggle-panel"),
        panelExpanded,
        "Hide",
        "Show",
        "insights panel"
      );
      setToggleButtonState(
        navbarSidebarButton,
        sidebarExpanded,
        "Hide Controls",
        "Show Controls",
        "study controls"
      );
      setToggleButtonState(
        navbarPanelButton,
        panelExpanded,
        "Hide Insights",
        "Show Insights",
        "insights panel"
      );

      if (!isCompactViewport()) {
        body.classList.remove("sidebar-open", "right-panel-open");
        quickSheet && (quickSheet.hidden = true);
        if (quickSheetFab) {
          quickSheetFab.setAttribute("aria-expanded", "false");
          quickSheetFab.textContent = "☰";
        }
      }

      if (layoutBackdrop) {
        layoutBackdrop.hidden = !(isCompactViewport() && (sidebarExpanded || panelExpanded));
      }
    }

    function setPanelView(view) {
      const safeView = view === "session" ? "session" : "load";

      if (rightPanelContent) {
        rightPanelContent.dataset.activeView = safeView;
      }

      panelTabButtons.forEach((button) => {
        const active = button.dataset.panelView === safeView;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
    }

    function toggleNavbarMenu() {
      if (!navbarOverflowMenu || !navbarMenuButton) {
        return;
      }

      const nextHidden = !navbarOverflowMenu.hidden;
      navbarOverflowMenu.hidden = nextHidden;
      navbarMenuButton.setAttribute("aria-expanded", String(!nextHidden));
    }

    function closeNavbarMenu() {
      if (!navbarOverflowMenu || !navbarMenuButton) {
        return;
      }

      navbarOverflowMenu.hidden = true;
      navbarMenuButton.setAttribute("aria-expanded", "false");
    }

    function closeOverlays() {
      document.querySelectorAll(".modal-overlay, .research-overlay, .onboarding-overlay").forEach((element) => {
        element.hidden = true;
      });
      if (quickSheet) {
        quickSheet.hidden = true;
      }
      if (quickSheetFab) {
        quickSheetFab.setAttribute("aria-expanded", "false");
        quickSheetFab.textContent = "☰";
      }

      closeNavbarMenu();
      closeCompactPanels();
      syncPanelButtonStates();
    }

    function closeCompactPanels() {
      if (!isCompactViewport()) {
        return;
      }

      body.classList.remove("sidebar-open", "right-panel-open");
    }

    function setToggleButtonState(button, expanded, openLabel, closedLabel, contextLabel) {
      if (!button) {
        return;
      }

      button.textContent = expanded ? openLabel : closedLabel;
      button.setAttribute("aria-label", (expanded ? openLabel : closedLabel) + " " + contextLabel);
      button.classList.toggle("is-active", expanded);
    }

    function clamp(value, min = 0, max = 100) {
      return Math.min(max, Math.max(min, value));
    }

    function runWhenIdle(callback, timeout = 1000) {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => callback(), { timeout });
        return;
      }

      window.setTimeout(callback, 0);
    }

    function debounce(callback, delay) {
      let timerId = null;

      return (...args) => {
        if (timerId !== null) {
          window.clearTimeout(timerId);
        }

        timerId = window.setTimeout(() => {
          timerId = null;
          callback(...args);
        }, delay);
      };
    }

    function ensureTour() {
      if (!tour && typeof window.OnboardingTour === "function") {
        tour = new window.OnboardingTour();
      }

      return tour;
    }

    function initializeWelcome() {
      if (userName) {
        return;
      }

      if (welcomeModal) {
        welcomeModal.hidden = false;
      }

      window.setTimeout(() => nameInput?.focus(), 120);
    }

    function loadUserName() {
      try {
        return window.localStorage.getItem("adaptivestudy-user-name") || "";
      } catch (error) {
        return "";
      }
    }

    function saveUserNameFromInput() {
      const value = nameInput?.value.trim() || "";

      if (!value) {
        nameInput?.focus();
        return;
      }

      userName = value;

      try {
        window.localStorage.setItem("adaptivestudy-user-name", userName);
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to save user name:", error);
      }

      if (welcomeModal) {
        welcomeModal.hidden = true;
      }

      ui.showToast("Welcome, " + userName + ". Let's study well.", "success");

      if (ensureTour()?.shouldShow()) {
        window.setTimeout(() => ensureTour()?.start(), 700);
      }
    }

    function skipNameForNow() {
      userName = "";

      try {
        window.localStorage.removeItem("adaptivestudy-user-name");
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to clear user name:", error);
      }

      if (welcomeModal) {
        welcomeModal.hidden = true;
      }

      if (ensureTour()?.shouldShow()) {
        window.setTimeout(() => ensureTour()?.start(), 700);
      }
    }

    function exportSessionReport() {
      const result = analytics.exportReport({ userName: userName || "Learner" });

      if (result?.mode === "download") {
        ui.showToast("Popup blocked, so the report was downloaded instead.", "warning");
      }
    }

    function endSession() {
      if (sessionEnded) {
        if (sessionSummaryOverlay) {
          sessionSummaryOverlay.hidden = false;
        }
        return;
      }

      sessionEnded = true;
      clearDemoTimer();
      demoModeActive = false;
      setDemoUiState(false);
      engine.stopPolling();
      analytics.logEvent("session_end", { durationMs: sessionSeconds * 1000 });

      if (timerIntervalId !== null) {
        window.clearInterval(timerIntervalId);
        timerIntervalId = null;
      }

      populateSessionSummary();
      if (sessionSummaryOverlay) {
        sessionSummaryOverlay.hidden = false;
      }

      ui.showToast("Session closed beautifully. Export the report when you're ready.", "success");
    }

    function populateSessionSummary() {
      const stats = analytics.getStats();
      const summary = content.getSessionSummary();
      const safeName = userName || "Learner";

      if (sessionSummaryTitle) {
        sessionSummaryTitle.textContent = "Amazing work, " + safeName + ".";
      }

      if (sessionSummarySubtitle) {
        sessionSummarySubtitle.textContent =
          "You completed a reflective study session. AdaptiveStudy tracked your focus, adapted the interface, and captured a final performance snapshot for your report.";
      }

      setText("summary-cards-seen", String(stats.cardsSeen));
      setText("summary-cards-learned", String(stats.cardsLearned));
      setText("summary-avg-load", String(Math.round(stats.avgLoadScore)));
      setText("summary-duration", formatDuration(stats.sessionDurationMs));
      setText("summary-top-subject", summary.topSubject || "Still emerging");
      setText("summary-weak-subject", summary.weakSubject || "Balanced");
      setText("summary-calm-time", Math.round(stats.calmModePct) + "%");
    }

    function setText(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }

    function formatDuration(durationMs) {
      const totalSeconds = Math.floor((durationMs || 0) / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }

    function resetEverything() {
      const confirmed = window.confirm("Reset notes, study progress, saved name, and tour state for a fresh session?");

      if (!confirmed) {
        return;
      }

      try {
        window.localStorage.removeItem("adaptivestudy-notes");
        window.localStorage.removeItem("adaptivestudy-user-name");
        window.localStorage.removeItem("adaptivestudy-tour-complete");
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to clear local storage:", error);
      }

      isResetting = true;
      if (notesField) {
        notesField.value = "";
      }
      content.clearPersistedState?.();
      window.location.reload();
    }
  });
})();
