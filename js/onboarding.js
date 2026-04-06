(function () {
  "use strict";

  class OnboardingTour {
    constructor() {
      this.steps = [
        {
          title: "Welcome to AdaptiveStudy",
          body: "This dashboard adapts to your cognitive state in real time. The easiest presentation flow is: show the dashboard, explain the four sensors, then trigger Demo Mode and narrate the interface adapting.",
          targetSelector: null,
          position: "center"
        },
        {
          title: "Mental Load Gauge",
          body: "This circle shows the live Mental Load Score from 0 to 100. It is computed from cursor entropy, hesitation, error rate, and scroll rhythm, then smoothed so the interface does not jitter.",
          targetSelector: "#navbar",
          position: "bottom"
        },
        {
          title: "Live Cognitive Sensors",
          body: "These four bars are the raw behavioral signals. In your presentation, explain that hesitation is the strongest predictor, while the others provide supporting evidence about stress, confusion, or disorientation.",
          targetSelector: "#right-panel",
          position: "left"
        },
        {
          title: "Your Study Cards",
          body: "The flashcards are content-adaptive. Under high load, the dashboard simplifies the content and prioritizes easier or struggle cards so the learner is not overwhelmed.",
          targetSelector: ".study-card",
          position: "top"
        },
        {
          title: "Subject Navigation",
          body: "The sidebar shows topic pills, completion progress, and mastery trends. This helps you explain that AdaptiveStudy is not only sensing load, but also connecting that signal to actual learning progress.",
          targetSelector: "#sidebar",
          position: "right"
        },
        {
          title: "Demo Mode",
          body: "Use Demo Mode in the presentation. It creates a smooth 20-second arc from low load to overload to recovery, so you can reliably show Calm Mode activating and then restoring Focus Mode.",
          targetSelector: "#btn-demo",
          position: "bottom"
        },
        {
          title: "How to Present It",
          body: "Say this clearly: AdaptiveStudy passively senses behavioral signals, fuses them into a Mental Load Score, and adapts the interface to reduce extraneous cognitive load. Then show the final report and end-session summary as the closing proof of value.",
          targetSelector: "#btn-end-session",
          position: "bottom"
        }
      ];

      this.currentStep = 0;
      this.overlay = document.getElementById("onboarding-overlay");
      this.spotlight = document.getElementById("tour-spotlight");
      this.tooltip = document.getElementById("tour-tooltip");
      this.title = document.getElementById("tour-title");
      this.body = document.getElementById("tour-body");
      this.stepBadge = document.getElementById("tour-step-badge");
      this.dots = document.getElementById("tour-dots");
      this.prevButton = document.getElementById("btn-tour-prev");
      this.nextButton = document.getElementById("btn-tour-next");

      this.prev = this.prev.bind(this);
      this.next = this.next.bind(this);

      this.prevButton?.addEventListener("click", this.prev);
      this.nextButton?.addEventListener("click", this.next);
    }

    shouldShow() {
      try {
        return window.localStorage.getItem("adaptivestudy-tour-complete") !== "1";
      } catch (error) {
        return true;
      }
    }

    start() {
      if (!this.overlay || !this.tooltip) {
        return;
      }

      this.overlay.hidden = false;
      this.currentStep = 0;
      this.showStep(0);
    }

    showStep(index) {
      const step = this.steps[index];

      if (!step || !this.tooltip || !this.title || !this.body || !this.stepBadge || !this.dots) {
        return;
      }

      this.currentStep = index;
      this.title.textContent = step.title;
      this.body.textContent = step.body;
      this.stepBadge.textContent = "Step " + (index + 1) + " of " + this.steps.length;
      this.renderDots(index);
      this.prevButton?.toggleAttribute("hidden", index === 0);
      this.nextButton && (this.nextButton.textContent = index === this.steps.length - 1 ? "Finish" : "Next →");

      if (!step.targetSelector) {
        this.spotlight && Object.assign(this.spotlight.style, {
          left: "50%",
          top: "50%",
          width: "0px",
          height: "0px",
          transform: "translate(-50%, -50%)"
        });
        Object.assign(this.tooltip.style, {
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        });
        return;
      }

      const target = document.querySelector(step.targetSelector);

      if (!target) {
        this.showCenteredTooltip();
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = 10;
      const spotlightLeft = rect.left - padding;
      const spotlightTop = rect.top - padding;
      const spotlightWidth = rect.width + padding * 2;
      const spotlightHeight = rect.height + padding * 2;

      if (this.spotlight) {
        Object.assign(this.spotlight.style, {
          left: spotlightLeft + "px",
          top: spotlightTop + "px",
          width: spotlightWidth + "px",
          height: spotlightHeight + "px",
          transform: "none"
        });
      }

      const tooltipWidth = Math.min(360, window.innerWidth - 24);
      let left = rect.left;
      let top = rect.bottom + 16;

      if (step.position === "top") {
        top = rect.top - 170;
      } else if (step.position === "left") {
        left = rect.left - tooltipWidth - 18;
        top = rect.top;
      } else if (step.position === "right") {
        left = rect.right + 18;
        top = rect.top;
      } else if (step.position === "center") {
        this.showCenteredTooltip();
        return;
      }

      left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left));
      top = Math.max(84, Math.min(window.innerHeight - 180, top));

      Object.assign(this.tooltip.style, {
        left: left + "px",
        top: top + "px",
        transform: "none"
      });
    }

    showCenteredTooltip() {
      if (!this.tooltip || !this.spotlight) {
        return;
      }

      Object.assign(this.spotlight.style, {
        left: "50%",
        top: "50%",
        width: "0px",
        height: "0px",
        transform: "translate(-50%, -50%)"
      });

      Object.assign(this.tooltip.style, {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)"
      });
    }

    renderDots(activeIndex) {
      if (!this.dots) {
        return;
      }

      this.dots.replaceChildren();

      this.steps.forEach((step, index) => {
        const dot = document.createElement("span");
        dot.className = "tour-dot" + (index === activeIndex ? " active" : "");
        dot.setAttribute("aria-hidden", "true");
        this.dots.appendChild(dot);
      });
    }

    next() {
      const nextIndex = this.currentStep + 1;

      if (nextIndex >= this.steps.length) {
        this.complete();
        return;
      }

      this.showStep(nextIndex);
    }

    prev() {
      this.showStep(Math.max(0, this.currentStep - 1));
    }

    complete() {
      if (this.overlay) {
        this.overlay.hidden = true;
      }

      try {
        window.localStorage.setItem("adaptivestudy-tour-complete", "1");
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to persist tour status:", error);
      }

      if (window.AdaptiveStudyDashboard?.ui?.showToast) {
        window.AdaptiveStudyDashboard.ui.showToast("✓ Tour complete! Press ? for keyboard shortcuts.", "success");
      }
    }
  }

  window.OnboardingTour = new OnboardingTour();
})();
