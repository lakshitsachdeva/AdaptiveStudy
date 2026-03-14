(function () {
  "use strict";

  class UIAdapter {
    constructor() {
      this.documentElement = document.documentElement;
      this.body = document.body;
      this.currentMode = "focus";
      this.lastObservedState = null;
      this.consecutiveStateCount = 0;
      this.gaugeCircumference = 163.4;
      this.sparklineHistoryLimit = 30;

      this.mentalLoadWidget = document.getElementById("mental-load-widget");
      this.gauge = document.getElementById("mental-load-gauge");
      this.gaugeTrack = document.getElementById("mental-load-gauge-track");
      this.gaugeFill = document.getElementById("mental-load-gauge-fill");
      this.gaugeScoreText = document.getElementById("mental-load-score");
      this.gaugeValueDescription = document.getElementById("mental-load-gauge-value");
      this.gaugeRangeLabel = document.getElementById("mental-load-range-label");
      this.modeBadge = document.getElementById("study-mode-badge");
      this.statusText = document.getElementById("status-bar-center");
      this.sessionQualityText = document.getElementById("status-bar-right");
      this.sparklineCanvas = document.getElementById("sparkline-canvas");

      this.metricBars = {
        cursor: document.getElementById("bar-cursor"),
        hesitation: document.getElementById("bar-hesitation"),
        error: document.getElementById("bar-error"),
        scroll: document.getElementById("bar-scroll")
      };

      this.metricValues = {
        cursor: document.getElementById("value-cursor"),
        hesitation: document.getElementById("value-hesitation"),
        error: document.getElementById("value-error"),
        scroll: document.getElementById("value-scroll")
      };

      this.metricRows = {
        cursor: document.getElementById("metric-row-cursor-entropy"),
        hesitation: document.getElementById("metric-row-hesitation-index"),
        error: document.getElementById("metric-row-error-rate"),
        scroll: document.getElementById("metric-row-scroll-rhythm")
      };

      this.metricProgressBars = {
        cursor: document.getElementById("metric-bar-cursor-entropy"),
        hesitation: document.getElementById("metric-bar-hesitation-index"),
        error: document.getElementById("metric-bar-error-rate"),
        scroll: document.getElementById("metric-bar-scroll-rhythm")
      };

      this.sparklineSvg = null;
      this.sparklinePath = null;
      this.sparklineGradientStops = null;

      this.initializeGauge();
      this.initializeSparkline();
    }

    updateMetricBars(metrics) {
      if (!metrics) {
        return;
      }

      const entries = [
        {
          key: "cursor",
          value: metrics.cursorEntropy
        },
        {
          key: "hesitation",
          value: metrics.hesitationIndex
        },
        {
          key: "error",
          value: metrics.errorRate
        },
        {
          key: "scroll",
          value: metrics.scrollRhythm
        }
      ];

      for (const entry of entries) {
        const safeValue = this.clamp(Math.round(entry.value || 0), 0, 100);
        const color = this.getMetricColor(safeValue);
        const bar = this.metricBars[entry.key];
        const valueLabel = this.metricValues[entry.key];
        const row = this.metricRows[entry.key];
        const progressBar = this.metricProgressBars[entry.key];

        if (bar) {
          bar.style.width = safeValue + "%";
          bar.style.backgroundColor = color;
        }

        if (valueLabel) {
          valueLabel.textContent = String(safeValue);
        }

        if (progressBar) {
          progressBar.setAttribute("aria-valuenow", String(safeValue));
        }

        if (row) {
          row.classList.remove("metric-calm", "metric-medium", "metric-high");
          row.classList.add(this.getMetricStateClass(safeValue));
        }
      }
    }

    updateLoadGauge(score) {
      if (!this.gaugeFill) {
        return;
      }

      const safeScore = this.clamp(Number(score) || 0, 0, 100);
      const dashOffset = this.gaugeCircumference * (1 - safeScore / 100);
      const gaugeColor = this.updateLoadGaugeColor(safeScore);

      if (this.gaugeTrack) {
        this.gaugeTrack.style.strokeDasharray = String(this.gaugeCircumference);
        this.gaugeTrack.style.strokeDashoffset = "0";
      }

      this.mentalLoadWidget?.style.setProperty("--load-pct", safeScore.toFixed(1));
      this.gaugeFill.style.strokeDasharray = String(this.gaugeCircumference);
      this.gaugeFill.style.strokeDashoffset = dashOffset.toFixed(2);
      this.gaugeFill.style.stroke = gaugeColor;

      if (this.gaugeScoreText) {
        this.gaugeScoreText.textContent = String(Math.round(safeScore));
      }

      if (this.gaugeValueDescription) {
        this.gaugeValueDescription.textContent =
          "Current mental load score is " + Math.round(safeScore) + " out of 100.";
      }
    }

    updateLoadGaugeColor(score) {
      const green = this.hexToRgb(this.getCssVariable("--accent-green", "#6BAF7A"));
      const amber = this.hexToRgb(this.getCssVariable("--accent-amber", "#E09A4F"));
      const coral = this.hexToRgb(this.getCssVariable("--accent-coral", "#D96B6B"));
      let color;

      if (score < 34) {
        color = green;
      } else if (score <= 66) {
        const ratio = (score - 34) / (66 - 34);
        color = this.interpolateColor(green, amber, ratio);
      } else {
        const ratio = (score - 66) / (100 - 66);
        color = this.interpolateColor(amber, coral, ratio);
      }

      const colorString = this.rgbToHex(color);
      this.documentElement.style.setProperty("--current-load-color", colorString);

      return colorString;
    }

    updateStatusBar(state) {
      const safeState = this.normalizeState(state);
      const statusMap = {
        low: {
          text: "✦ Optimal Focus",
          quality: "Excellent",
          rangeLabel: "Calm"
        },
        medium: {
          text: "◈ Elevated Load Detected",
          quality: "Good",
          rangeLabel: "Moderate"
        },
        high: {
          text: "⚠ Overload — Simplifying Interface",
          quality: "Needs Rest",
          rangeLabel: "High"
        }
      };

      const config = statusMap[safeState];

      if (this.statusText) {
        this.statusText.textContent = config.text;
      }

      if (this.sessionQualityText) {
        this.sessionQualityText.textContent = "Session Quality: " + config.quality;
      }

      if (this.gaugeRangeLabel) {
        this.gaugeRangeLabel.textContent = config.rangeLabel;
      }

      this.body.classList.remove("load-low", "load-medium", "load-high");
      this.body.classList.add("load-" + safeState);

      if (this.mentalLoadWidget) {
        this.mentalLoadWidget.classList.remove("load-low", "load-medium", "load-high", "load-calm");
        this.mentalLoadWidget.classList.add("load-" + safeState);
      }
    }

    transitionToMode(state) {
      const safeState = this.normalizeState(state);

      // Require repeated agreement from the sensor state before changing the whole interface mode.
      if (safeState === this.lastObservedState) {
        this.consecutiveStateCount += 1;
      } else {
        this.lastObservedState = safeState;
        this.consecutiveStateCount = 1;
      }

      const desiredMode = safeState === "high" ? "calm" : "focus";

      if (desiredMode === this.currentMode || this.consecutiveStateCount < 3) {
        return;
      }

      if (desiredMode === "calm") {
        this.activateCalmMode();
      } else {
        this.activateFocusMode();
      }
    }

    activateCalmMode() {
      this.currentMode = "calm";
      this.body.classList.add("calm-mode");

      if (this.modeBadge) {
        this.modeBadge.textContent = "🌿 Calm Mode";
        this.modeBadge.classList.remove("mode-focus", "mode-overload");
        this.modeBadge.classList.add("mode-calm");
      }

      this.showToast("Interface simplified to reduce cognitive load");
      this.adjustFlashcardAutoAdvance("calm");
      console.log("[AdaptiveStudy] Entering Calm Mode");
    }

    activateFocusMode() {
      this.currentMode = "focus";
      this.body.classList.remove("calm-mode");

      if (this.modeBadge) {
        this.modeBadge.textContent = "⚡ Focus Mode";
        this.modeBadge.classList.remove("mode-calm", "mode-overload");
        this.modeBadge.classList.add("mode-focus");
      }

      this.showToast("Full interface restored");
      this.adjustFlashcardAutoAdvance("focus");
      console.log("[AdaptiveStudy] Returning to Focus Mode");
    }

    showToast(message, duration) {
      const safeDuration = Math.max(1200, duration || 3000);
      const toast = document.createElement("div");

      toast.className = "toast";
      toast.textContent = message;
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");

      this.body.appendChild(toast);

      window.setTimeout(() => {
        toast.remove();
      }, safeDuration + 350);
    }

    updateSparkline(scoreHistory) {
      if (!this.sparklineCanvas) {
        return;
      }

      // Keep the sparkline compact and legible by normalizing only the recent history window.
      const history = Array.isArray(scoreHistory)
        ? scoreHistory
            .slice(-this.sparklineHistoryLimit)
            .map((value) => this.clamp(Number(value) || 0, 0, 100))
        : [];

      if (!history.length) {
        this.initializeSparkline();
        if (this.sparklinePath) {
          this.sparklinePath.setAttribute("d", "");
        }
        return;
      }

      if (!this.sparklineSvg || !this.sparklinePath || !this.sparklineGradientStops) {
        this.initializeSparkline();
      }

      const width = 220;
      const height = 60;
      const padX = 8;
      const padY = 8;
      const min = Math.min.apply(null, history);
      const max = Math.max.apply(null, history);
      const range = Math.max(1, max - min);

      const points = history.map((value, index) => {
        const x =
          history.length === 1
            ? width / 2
            : padX + (index / (history.length - 1)) * (width - padX * 2);
        const normalizedValue = range === 1 && max === min ? 0.5 : (value - min) / range;
        const y = height - padY - normalizedValue * (height - padY * 2);
        return { x, y };
      });

      const pathData = points
        .map((point, index) => (index === 0 ? "M " : "L ") + point.x.toFixed(2) + " " + point.y.toFixed(2))
        .join(" ");

      const trend = history[history.length - 1] - history[0];
      const gradient = this.getSparklineGradient(trend);

      this.sparklineGradientStops.start.setAttribute("stop-color", gradient.start);
      this.sparklineGradientStops.end.setAttribute("stop-color", gradient.end);
      this.sparklinePath.setAttribute("d", pathData);
    }

    initializeGauge() {
      if (!this.gaugeFill) {
        return;
      }

      this.gaugeFill.style.strokeDasharray = String(this.gaugeCircumference);
      this.gaugeFill.style.strokeDashoffset = String(this.gaugeCircumference * 0.38);
      this.gaugeFill.style.stroke = "var(--current-load-color)";

      if (this.gaugeTrack) {
        this.gaugeTrack.style.strokeDasharray = String(this.gaugeCircumference);
        this.gaugeTrack.style.strokeDashoffset = "0";
      }
    }

    initializeSparkline() {
      if (!this.sparklineCanvas) {
        return;
      }

      const namespace = "http://www.w3.org/2000/svg";
      const gradientId = "adaptive-study-sparkline-gradient";
      const svg = document.createElementNS(namespace, "svg");
      const defs = document.createElementNS(namespace, "defs");
      const gradient = document.createElementNS(namespace, "linearGradient");
      const startStop = document.createElementNS(namespace, "stop");
      const endStop = document.createElementNS(namespace, "stop");
      const path = document.createElementNS(namespace, "path");

      svg.setAttribute("viewBox", "0 0 220 60");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "60");
      svg.setAttribute("aria-hidden", "true");
      svg.style.overflow = "visible";

      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("x2", "100%");
      gradient.setAttribute("y2", "0%");

      startStop.setAttribute("offset", "0%");
      startStop.setAttribute("stop-color", this.getCssVariable("--accent-green", "#6BAF7A"));

      endStop.setAttribute("offset", "100%");
      endStop.setAttribute("stop-color", this.getCssVariable("--accent-coral", "#D96B6B"));

      gradient.appendChild(startStop);
      gradient.appendChild(endStop);
      defs.appendChild(gradient);

      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "url(#" + gradientId + ")");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("d", "");

      svg.appendChild(defs);
      svg.appendChild(path);

      this.sparklineCanvas.replaceChildren(svg);
      this.sparklineSvg = svg;
      this.sparklinePath = path;
      this.sparklineGradientStops = {
        start: startStop,
        end: endStop
      };
    }

    adjustFlashcardAutoAdvance(mode) {
      const multiplier = mode === "calm" ? 1.8 : 1;
      const detail = {
        mode,
        multiplier
      };

      this.body.dataset.autoAdvanceMode = mode;

      // Broadcast a generic event first, then fall back to a few likely controller interfaces.
      if (typeof window.CustomEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("adaptive-study:auto-advance", {
            detail
          })
        );
      }

      const candidates = [
        window.studySession,
        window.flashcardController,
        window.AdaptiveStudySession,
        window.StudySession && window.StudySession.instance
      ].filter(Boolean);

      for (const candidate of candidates) {
        if (typeof candidate.setAutoAdvanceMultiplier === "function") {
          candidate.setAutoAdvanceMultiplier(multiplier);
          return;
        }

        if (typeof candidate.setAutoAdvanceDelay === "function") {
          const baseDelay = Number(candidate.baseAutoAdvanceDelay || candidate.autoAdvanceDelay || 4000);
          candidate.setAutoAdvanceDelay(Math.round(baseDelay * multiplier));
          return;
        }

        if (mode === "calm" && typeof candidate.slowDownAutoAdvance === "function") {
          candidate.slowDownAutoAdvance(multiplier);
          return;
        }

        if (mode === "focus" && typeof candidate.restoreAutoAdvance === "function") {
          candidate.restoreAutoAdvance();
          return;
        }
      }
    }

    getMetricColor(value) {
      if (value < 40) {
        return this.getCssVariable("--accent-green", "#6BAF7A");
      }

      if (value <= 70) {
        return this.getCssVariable("--accent-amber", "#E09A4F");
      }

      return this.getCssVariable("--accent-coral", "#D96B6B");
    }

    getMetricStateClass(value) {
      if (value < 40) {
        return "metric-calm";
      }

      if (value <= 70) {
        return "metric-medium";
      }

      return "metric-high";
    }

    getSparklineGradient(trend) {
      const green = this.getCssVariable("--accent-green", "#6BAF7A");
      const amber = this.getCssVariable("--accent-amber", "#E09A4F");
      const coral = this.getCssVariable("--accent-coral", "#D96B6B");

      if (trend > 5) {
        return {
          start: green,
          end: coral
        };
      }

      if (trend < -5) {
        return {
          start: coral,
          end: green
        };
      }

      return {
        start: green,
        end: amber
      };
    }

    normalizeState(state) {
      if (state === "high" || state === "medium" || state === "low") {
        return state;
      }

      return "medium";
    }

    getCssVariable(name, fallback) {
      const value = getComputedStyle(this.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    }

    hexToRgb(hex) {
      const normalized = hex.replace("#", "");
      const safeHex = normalized.length === 3
        ? normalized
            .split("")
            .map((part) => part + part)
            .join("")
        : normalized;

      return {
        r: parseInt(safeHex.slice(0, 2), 16),
        g: parseInt(safeHex.slice(2, 4), 16),
        b: parseInt(safeHex.slice(4, 6), 16)
      };
    }

    interpolateColor(start, end, ratio) {
      const safeRatio = this.clamp(ratio, 0, 1);
      return {
        r: Math.round(start.r + (end.r - start.r) * safeRatio),
        g: Math.round(start.g + (end.g - start.g) * safeRatio),
        b: Math.round(start.b + (end.b - start.b) * safeRatio)
      };
    }

    rgbToHex(color) {
      return (
        "#" +
        [color.r, color.g, color.b]
          .map((value) => value.toString(16).padStart(2, "0"))
          .join("")
      );
    }

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }
  }

  window.UIAdapter = UIAdapter;
})();
