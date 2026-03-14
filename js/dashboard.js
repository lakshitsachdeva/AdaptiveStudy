(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    if (
      typeof window.CognitiveEngine !== "function" ||
      typeof window.UIAdapter !== "function" ||
      !window.StudyContent
    ) {
      return;
    }

    const engine = new window.CognitiveEngine();
    const ui = new window.UIAdapter();
    const content = window.StudyContent;
    const scoreHistory = [];

    const body = document.body;
    const timerDisplay = document.getElementById("session-timer");
    const notesField = document.getElementById("study-notes");
    const flipButton = document.getElementById("btn-flip");
    const learnedButton = document.getElementById("btn-learned");
    const reviewButton = document.getElementById("btn-review");
    const skipButton = document.getElementById("btn-skip");
    const sidebarToggleButton = document.getElementById("btn-toggle-sidebar");
    const panelToggleButton = document.getElementById("btn-toggle-panel");
    const mobileMenuButton = document.getElementById("btn-mobile-menu");
    const mobilePanelButton = document.getElementById("btn-mobile-panel");
    const demoToggleButton = document.getElementById("btn-demo");
    const demoBadge = document.getElementById("demo-badge");
    const topicButtons = Array.from(document.querySelectorAll(".topic-pill-button"));

    let sessionSeconds = 0;
    let breakSuggestionShown = false;
    let timerIntervalId = null;
    let demoIntervalId = null;
    let demoModeActive = false;
    let demoStartedAt = 0;

    content.renderCard();
    restoreNotes();
    updateSessionTimer();
    startSessionTimer();
    wireButtons();
    wireTopicPills();
    wireNotes();
    wireKeyboardShortcuts();
    syncPanelButtonStates();
    startRealPolling();

    window.addEventListener("resize", () => {
      syncPanelButtonStates();
    });

    window.AdaptiveStudyDashboard = {
      engine,
      ui,
      content
    };

    function startSessionTimer() {
      timerIntervalId = window.setInterval(() => {
        sessionSeconds += 1;
        updateSessionTimer();

        if (!breakSuggestionShown && sessionSeconds >= 25 * 60) {
          breakSuggestionShown = true;
          ui.showToast("🌿 Pomodoro break suggested");
        }
      }, 1000);
    }

    function updateSessionTimer() {
      if (!timerDisplay) {
        return;
      }

      const minutes = Math.floor(sessionSeconds / 60);
      const seconds = sessionSeconds % 60;
      timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }

    function startRealPolling() {
      engine.startPolling((metrics) => {
        applyMetrics(metrics);
      }, 500);
    }

    function applyMetrics(metrics) {
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
    }

    function wireButtons() {
      if (flipButton) {
        flipButton.addEventListener("click", () => content.flipCard());
      }

      if (learnedButton) {
        learnedButton.addEventListener("click", () => content.markLearned());
      }

      if (reviewButton) {
        reviewButton.addEventListener("click", () => content.markReview());
      }

      if (skipButton) {
        skipButton.addEventListener("click", () => content.nextCard());
      }

      if (sidebarToggleButton) {
        sidebarToggleButton.addEventListener("click", () => toggleSidebar());
      }

      if (panelToggleButton) {
        panelToggleButton.addEventListener("click", () => togglePanel());
      }

      if (mobileMenuButton) {
        mobileMenuButton.addEventListener("click", () => toggleSidebar());
      }

      if (mobilePanelButton) {
        mobilePanelButton.addEventListener("click", () => togglePanel());
      }

      if (demoToggleButton) {
        demoToggleButton.addEventListener("click", () => {
          if (demoModeActive) {
            stopDemoMode();
          } else {
            startDemoMode();
          }
        });
      }
    }

    function wireTopicPills() {
      for (const button of topicButtons) {
        button.addEventListener("click", () => {
          const subject = button.dataset.topic || button.textContent.trim();
          content.filterBySubject(subject);
        });
      }
    }

    function wireNotes() {
      if (!notesField) {
        return;
      }

      notesField.addEventListener("input", () => {
        try {
          window.localStorage.setItem("adaptivestudy-notes", notesField.value);
        } catch (error) {
          console.warn("[AdaptiveStudy] Unable to save notes:", error);
        }
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
        if (event.defaultPrevented || event.repeat || shouldIgnoreShortcut(event)) {
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
        }
      });
    }

    function shouldIgnoreShortcut(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return true;
      }

      const target = event.target;

      if (!target || !(target instanceof HTMLElement)) {
        return false;
      }

      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLButtonElement ||
        target.isContentEditable
      );
    }

    function startDemoMode() {
      demoModeActive = true;
      demoStartedAt = Date.now();

      engine.stopPolling();
      clearDemoTimer();
      setDemoUiState(true);

      applyMetrics(buildDemoMetrics(0));

      demoIntervalId = window.setInterval(() => {
        const elapsedSeconds = (Date.now() - demoStartedAt) / 1000;
        applyMetrics(buildDemoMetrics(elapsedSeconds));
      }, 500);
    }

    function stopDemoMode() {
      demoModeActive = false;
      clearDemoTimer();
      setDemoUiState(false);
      startRealPolling();
    }

    function clearDemoTimer() {
      if (demoIntervalId !== null) {
        window.clearInterval(demoIntervalId);
        demoIntervalId = null;
      }
    }

    function setDemoUiState(isActive) {
      if (demoToggleButton) {
        demoToggleButton.setAttribute("aria-pressed", String(isActive));
        demoToggleButton.textContent = isActive ? "Stop Demo" : "Demo Mode";
      }

      if (demoBadge) {
        demoBadge.hidden = !isActive;
      }
    }

    function buildDemoMetrics(elapsedSeconds) {
      const compositeScore = getDemoComposite(elapsedSeconds);
      const safeComposite = clamp(compositeScore, 0, 100);
      const state = getStateFromScore(safeComposite);

      return {
        cursorEntropy: clamp(safeComposite * 0.84 + Math.sin(elapsedSeconds * 1.4) * 8, 0, 100),
        hesitationIndex: clamp(safeComposite * 1.02 + Math.cos(elapsedSeconds * 1.1 + 0.5) * 7, 0, 100),
        errorRate: clamp(safeComposite * 0.63 + Math.sin(elapsedSeconds * 1.7 + 1.2) * 5, 0, 100),
        scrollRhythm: clamp(safeComposite * 0.78 + Math.cos(elapsedSeconds * 1.3 + 2.4) * 6, 0, 100),
        composite: Math.round(safeComposite),
        state
      };
    }

    function getDemoComposite(elapsedSeconds) {
      if (elapsedSeconds <= 5) {
        return lerp(20, 45, elapsedSeconds / 5);
      }

      if (elapsedSeconds <= 10) {
        return lerp(45, 78, (elapsedSeconds - 5) / 5);
      }

      if (elapsedSeconds <= 15) {
        return lerp(78, 30, (elapsedSeconds - 10) / 5);
      }

      return 30;
    }

    function getStateFromScore(score) {
      if (score <= 33) {
        return "low";
      }

      if (score <= 66) {
        return "medium";
      }

      return "high";
    }

    function lerp(start, end, ratio) {
      return start + (end - start) * clamp(ratio, 0, 1);
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function toggleSidebar() {
      if (isCompactViewport()) {
        const isOpen = !body.classList.contains("sidebar-open");
        body.classList.toggle("sidebar-open", isOpen);
        body.classList.toggle("sidebar-hidden", !isOpen);
        body.classList.toggle("sidebar-collapsed", !isOpen);
      } else {
        const isHidden = !body.classList.contains("sidebar-hidden");
        body.classList.toggle("sidebar-hidden", isHidden);
        body.classList.toggle("sidebar-collapsed", isHidden);
      }

      syncPanelButtonStates();
    }

    function togglePanel() {
      if (isCompactViewport()) {
        const isOpen = !body.classList.contains("right-panel-open");
        body.classList.toggle("right-panel-open", isOpen);
        body.classList.toggle("panel-hidden", !isOpen);
        body.classList.toggle("right-panel-collapsed", !isOpen);
      } else {
        const isHidden = !body.classList.contains("panel-hidden");
        body.classList.toggle("panel-hidden", isHidden);
        body.classList.toggle("right-panel-collapsed", isHidden);
      }

      syncPanelButtonStates();
    }

    function isCompactViewport() {
      return window.matchMedia("(max-width: 899px)").matches;
    }

    function syncPanelButtonStates() {
      if (isCompactViewport()) {
        if (sidebarToggleButton) {
          sidebarToggleButton.setAttribute(
            "aria-expanded",
            String(body.classList.contains("sidebar-open"))
          );
        }

        if (mobileMenuButton) {
          mobileMenuButton.setAttribute(
            "aria-expanded",
            String(body.classList.contains("sidebar-open"))
          );
        }

        if (panelToggleButton) {
          panelToggleButton.setAttribute(
            "aria-expanded",
            String(body.classList.contains("right-panel-open"))
          );
        }

        if (mobilePanelButton) {
          mobilePanelButton.setAttribute(
            "aria-expanded",
            String(body.classList.contains("right-panel-open"))
          );
        }

        return;
      }

      body.classList.remove("sidebar-open", "right-panel-open");

      if (sidebarToggleButton) {
        sidebarToggleButton.setAttribute(
          "aria-expanded",
          String(!body.classList.contains("sidebar-hidden"))
        );
      }

      if (mobileMenuButton) {
        mobileMenuButton.setAttribute(
          "aria-expanded",
          String(!body.classList.contains("sidebar-hidden"))
        );
      }

      if (panelToggleButton) {
        panelToggleButton.setAttribute(
          "aria-expanded",
          String(!body.classList.contains("panel-hidden"))
        );
      }

      if (mobilePanelButton) {
        mobilePanelButton.setAttribute(
          "aria-expanded",
          String(!body.classList.contains("panel-hidden"))
        );
      }
    }
  });
})();
