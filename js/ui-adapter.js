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
      this.numberAnimationState = new WeakMap();
      this.isTouchDevice = window.matchMedia("(hover: none)").matches;
      this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.connection = typeof navigator !== "undefined" ? navigator.connection || navigator.mozConnection || navigator.webkitConnection : null;
      this.enableEnhancedEffects = false;
      this.lowPowerDevice = Boolean(
        !this.enableEnhancedEffects ||
        this.prefersReducedMotion ||
        this.isTouchDevice ||
        (typeof navigator !== "undefined" && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 6) ||
        this.connection?.saveData
      );

      this.mentalLoadWidget = document.getElementById("mental-load-widget");
      this.gaugeFill = document.getElementById("mental-load-gauge-fill");
      this.gaugeTrack = document.getElementById("mental-load-gauge-track");
      this.gaugeScoreText = document.getElementById("mental-load-score");
      this.gaugeRangeLabel = document.getElementById("mental-load-range-label");
      this.modeBadge = document.getElementById("study-mode-badge");
      this.statusText = document.getElementById("status-bar-center");
      this.sessionQualityText = document.getElementById("status-bar-right");
      this.sparklineCanvas = document.getElementById("sparkline-canvas");
      this.calibrationBar = document.getElementById("calibration-bar");
      this.calibrationFill = document.getElementById("calibration-fill");
      this.calibrationLabel = document.getElementById("calibration-label");
      this.confidenceIndicator = document.getElementById("confidence-indicator");
      this.masteryBarList = document.getElementById("mastery-bar-list");
      this.cursorDot = document.getElementById("cursor-dot");
      this.cursorRing = document.getElementById("cursor-ring");

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

      this.statTiles = {
        cardsSeen: document.getElementById("stat-cards-seen"),
        cardsLearned: document.getElementById("stat-cards-learned"),
        calmTime: document.getElementById("stat-calm-time"),
        avgLoad: document.getElementById("stat-avg-load")
      };

      this.researchTiles = {
        avg: document.getElementById("research-avg-score"),
        peak: document.getElementById("research-peak-score"),
        calm: document.getElementById("research-calm-pct"),
        switches: document.getElementById("research-switches"),
        cardsDone: document.getElementById("research-cards-done"),
        sessionTime: document.getElementById("research-session-time")
      };

      this.sparklineSvg = null;
      this.sparklinePath = null;
      this.sparklineGradientStops = null;
      this.cursorTarget = { x: -999, y: -999 };
      this.cursorPosition = { x: -999, y: -999 };
      this.lastMasterySignature = "";

      if (this.lowPowerDevice) {
        this.body.classList.add("performance-mode");
      }

      this.initializeGauge();
      this.initializeSparkline();
      this.scheduleNonEssentialEffects();
    }

    scheduleNonEssentialEffects() {
      if (this.lowPowerDevice) {
        return;
      }

      const startEffects = () => {
        this.initializeCursor();
        this.initializeCardTilt();
      };

      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(startEffects, { timeout: 1200 });
        return;
      }

      window.setTimeout(startEffects, 800);
    }

    animateNumber(element, fromValue, toValue, duration = 600, formatter) {
      if (!element) {
        return;
      }

      if (this.lowPowerDevice) {
        element.textContent = formatter
          ? formatter(toValue)
          : Number.isInteger(toValue)
            ? String(Math.round(toValue))
            : Number(toValue || 0).toFixed(1);
        return;
      }

      const start = performance.now();
      const startValue = Number.isFinite(fromValue) ? fromValue : 0;
      const endValue = Number.isFinite(toValue) ? toValue : 0;

      if (this.numberAnimationState.has(element)) {
        cancelAnimationFrame(this.numberAnimationState.get(element));
      }

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const value = startValue + (endValue - startValue) * progress;
        element.textContent = formatter
          ? formatter(value)
          : Number.isInteger(endValue)
            ? String(Math.round(value))
            : value.toFixed(1);

        if (progress < 1) {
          const frame = requestAnimationFrame(tick);
          this.numberAnimationState.set(element, frame);
        }
      };

      const frame = requestAnimationFrame(tick);
      this.numberAnimationState.set(element, frame);
    }

    initializeCursor() {
      if (this.lowPowerDevice || !this.cursorDot || !this.cursorRing) {
        this.cursorDot?.setAttribute("hidden", "hidden");
        this.cursorRing?.setAttribute("hidden", "hidden");
        return;
      }

      document.addEventListener("mousemove", (event) => {
        this.cursorTarget.x = event.clientX;
        this.cursorTarget.y = event.clientY;
      }, { passive: true });

      document.addEventListener("mousedown", () => {
        this.cursorRing.classList.add("cursor-pressed");
      });

      document.addEventListener("mouseup", () => {
        this.cursorRing.classList.remove("cursor-pressed");
      });

      document.querySelectorAll("button, .card, .topic-pill, a, textarea").forEach((element) => {
        element.addEventListener("mouseenter", () => {
          this.cursorRing?.classList.add("cursor-expanded");
        });
        element.addEventListener("mouseleave", () => {
          this.cursorRing?.classList.remove("cursor-expanded");
        });
      });

      const animate = () => {
        this.cursorPosition.x += (this.cursorTarget.x - this.cursorPosition.x) * 0.22;
        this.cursorPosition.y += (this.cursorTarget.y - this.cursorPosition.y) * 0.22;

        this.cursorDot.style.transform = "translate(" + this.cursorTarget.x + "px," + this.cursorTarget.y + "px)";
        this.cursorRing.style.transform = "translate(" + this.cursorPosition.x + "px," + this.cursorPosition.y + "px)";
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }

    initializeCardTilt() {
      if (this.lowPowerDevice) {
        return;
      }

      document.querySelectorAll(".card, .content-card").forEach((card) => {
        card.addEventListener("mousemove", (event) => {
          const rect = card.getBoundingClientRect();
          const posX = (event.clientX - rect.left) / rect.width;
          const posY = (event.clientY - rect.top) / rect.height;
          const rotateX = (posY - 0.5) * -6;
          const rotateY = (posX - 0.5) * 6;

          card.style.setProperty("--card-rotate-x", rotateX.toFixed(2) + "deg");
          card.style.setProperty("--card-rotate-y", rotateY.toFixed(2) + "deg");
          card.style.setProperty("--shimmer-x", (posX * 100 - 50).toFixed(1) + "%");
          card.style.setProperty("--shimmer-y", (posY * 100 - 50).toFixed(1) + "%");
        });

        card.addEventListener("mouseleave", () => {
          card.style.setProperty("--card-rotate-x", "0deg");
          card.style.setProperty("--card-rotate-y", "0deg");
          card.style.setProperty("--shimmer-x", "-120%");
          card.style.setProperty("--shimmer-y", "-120%");
        });
      });
    }

    updateMetricBars(metrics) {
      if (!metrics) {
        return;
      }

      const entries = [
        ["cursor", metrics.cursorEntropy],
        ["hesitation", metrics.hesitationIndex],
        ["error", metrics.errorRate],
        ["scroll", metrics.scrollRhythm]
      ];

      for (const [key, value] of entries) {
        const safeValue = this.clamp(Math.round(Number(value) || 0), 0, 100);
        const color = this.getMetricColor(safeValue);
        const bar = this.metricBars[key];
        const label = this.metricValues[key];
        const fromValue = Number(label?.dataset.value || 0);

        if (bar) {
          bar.style.width = safeValue + "%";
          bar.style.color = color;
          bar.classList.remove("skeleton");
        }

        if (label) {
          label.dataset.value = String(safeValue);
          this.animateNumber(label, fromValue, safeValue, 360);
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
      }

      this.gaugeFill.style.strokeDasharray = String(this.gaugeCircumference);
      this.gaugeFill.style.strokeDashoffset = dashOffset.toFixed(2);
      this.gaugeFill.style.stroke = gaugeColor;

      if (this.gaugeScoreText) {
        const fromValue = Number(this.gaugeScoreText.dataset.value || this.gaugeScoreText.textContent || 0);
        this.gaugeScoreText.dataset.value = String(Math.round(safeScore));
        this.gaugeScoreText.classList.remove("gauge-number-changing");
        void this.gaugeScoreText.offsetWidth;
        this.gaugeScoreText.classList.add("gauge-number-changing");
        this.animateNumber(this.gaugeScoreText, fromValue, safeScore, 500, (value) => String(Math.round(value)));
      }
    }

    updateLoadGaugeColor(score) {
      const green = this.hexToRgb(this.getCssVariable("--accent-green", "#6BAF7A"));
      const amber = this.hexToRgb(this.getCssVariable("--accent-amber", "#E09A4F"));
      const coral = this.hexToRgb(this.getCssVariable("--accent-coral", "#D96B6B"));
      let rgb;

      if (score < 34) {
        rgb = green;
      } else if (score <= 66) {
        rgb = this.interpolateColor(green, amber, (score - 34) / 32);
      } else {
        rgb = this.interpolateColor(amber, coral, (score - 66) / 34);
      }

      const color = this.rgbToHex(rgb);
      this.documentElement.style.setProperty("--current-load-color", color);
      return color;
    }

    updateStatusBar(state) {
      const safeState = this.normalizeState(state);
      const map = {
        low: ["✦ Optimal Focus", "Excellent", "Calm"],
        medium: ["◈ Elevated Load Detected", "Good", "Moderate"],
        high: ["⚠ Overload — Simplifying Interface", "Needs Rest", "High"]
      };
      const [statusLabel, qualityLabel, rangeLabel] = map[safeState];

      if (this.statusText) {
        this.statusText.textContent = statusLabel;
      }

      if (this.sessionQualityText) {
        this.sessionQualityText.textContent = "Session Quality: " + qualityLabel;
      }

      if (this.gaugeRangeLabel) {
        this.gaugeRangeLabel.textContent = rangeLabel;
      }

      this.body.classList.remove("load-low", "load-medium", "load-high", "overload-mode");
      this.body.classList.add("load-" + safeState);

      if (safeState === "high" && Number(this.gaugeScoreText?.dataset.value || 0) > 85) {
        this.body.classList.add("overload-mode");
      }
    }

    transitionToMode(state) {
      const safeState = this.normalizeState(state);

      if (safeState === this.lastObservedState) {
        this.consecutiveStateCount += 1;
      } else {
        this.lastObservedState = safeState;
        this.consecutiveStateCount = 1;
      }

      const targetMode = safeState === "high" ? "calm" : "focus";

      if (targetMode === this.currentMode || this.consecutiveStateCount < 3) {
        return;
      }

      if (targetMode === "calm") {
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
        this.modeBadge.className = "study-mode-badge mode-calm";
      }

      this.showModeWave("rgba(107,175,122,0.15)");
      this.showToast("Interface simplified to reduce cognitive load", "calm");
      this.adjustFlashcardAutoAdvance("calm");
      console.log("[AdaptiveStudy] Entering Calm Mode");
    }

    activateFocusMode() {
      this.currentMode = "focus";
      this.body.classList.remove("calm-mode");

      if (this.modeBadge) {
        this.modeBadge.textContent = "⚡ Focus Mode";
        this.modeBadge.className = "study-mode-badge mode-focus";
      }

      this.showModeWave("rgba(106,155,181,0.1)");
      this.showToast("Full interface restored", "success");
      this.adjustFlashcardAutoAdvance("focus");
      console.log("[AdaptiveStudy] Returning to Focus Mode");
    }

    showModeWave(color) {
      if (this.lowPowerDevice) {
        return;
      }

      const wave = document.createElement("div");
      wave.className = "mode-wave";
      Object.assign(wave.style, {
        position: "fixed",
        left: "50%",
        top: "50%",
        width: "220px",
        height: "220px",
        marginLeft: "-110px",
        marginTop: "-110px",
        borderRadius: "50%",
        background: color,
        zIndex: "900",
        pointerEvents: "none",
        transform: "scale(0)",
        opacity: "1",
        transition: "transform 0.8s ease, opacity 0.8s ease"
      });

      document.body.appendChild(wave);
      requestAnimationFrame(() => {
        wave.style.transform = "scale(8)";
        wave.style.opacity = "0";
      });

      window.setTimeout(() => wave.remove(), 850);
    }

    showCalibrationState(progress, isComplete) {
      if (!this.calibrationBar || !this.calibrationFill || !this.calibrationLabel) {
        return;
      }

      if (!isComplete) {
        this.calibrationBar.hidden = false;
        this.calibrationBar.classList.remove("is-complete");
        this.calibrationFill.style.width = progress + "%";
        this.calibrationLabel.textContent = "Calibrating to your baseline... " + Math.round(progress) + "%";
        Object.values(this.metricBars).forEach((bar) => bar?.classList.add("skeleton"));
        return;
      }

      this.calibrationFill.style.width = "100%";
      this.calibrationLabel.textContent = "Calibrated to your interaction style";
      this.calibrationBar.classList.add("is-complete");
      Object.values(this.metricBars).forEach((bar) => bar?.classList.remove("skeleton"));

      window.setTimeout(() => {
        if (this.calibrationBar) {
          this.calibrationBar.hidden = true;
          this.calibrationBar.classList.remove("is-complete");
        }
      }, 650);
    }

    updateConfidence(score) {
      if (!this.confidenceIndicator) {
        return;
      }

      const safeScore = this.clamp(Math.round(Number(score) || 0), 0, 100);
      let level = "low";
      let message = "Still learning your baseline...";

      if (safeScore > 70) {
        level = "high";
        message = "High confidence";
      } else if (safeScore >= 30) {
        level = "medium";
        message = "Calibrated";
      }

      this.confidenceIndicator.innerHTML =
        '<span class="confidence-level ' + level + '">Signal Confidence: ' + safeScore + '%</span>' +
        '<span class="confidence-caption">' + message + "</span>";
    }

    updateSessionStats(stats) {
      if (!stats) {
        return;
      }

      this.animateTile(this.statTiles.cardsSeen, stats.cardsSeen || 0);
      this.animateTile(this.statTiles.cardsLearned, stats.cardsLearned || 0);
      this.animateTile(this.statTiles.avgLoad, stats.avgLoadScore || stats.avgLoad || 0);

      if (this.statTiles.calmTime) {
        const value = Number(stats.calmModePct || stats.calmPct || 0);
        const fromValue = Number(this.statTiles.calmTime.dataset.value || 0);
        if (Math.round(fromValue) !== Math.round(value)) {
          this.statTiles.calmTime.dataset.value = String(value);
          this.animateNumber(this.statTiles.calmTime, fromValue, value, 600, (val) => Math.round(val) + "%");
        }
      }
    }

    updateResearchOverlay(stats) {
      if (!stats) {
        return;
      }

      this.animateTile(this.researchTiles.avg, stats.avgLoadScore || stats.avg || 0);
      this.animateTile(this.researchTiles.peak, stats.peakLoadScore || stats.max || 0);
      this.animateTile(this.researchTiles.switches, stats.modeSwitchCount || 0);
      this.animateTile(this.researchTiles.cardsDone, stats.totalSeen || stats.cardsSeen || 0);

      if (this.researchTiles.calm) {
        const calmPct = Number(stats.calmModePct || stats.calmPct || 0);
        const fromValue = Number(this.researchTiles.calm.dataset.value || 0);
        if (Math.round(fromValue) !== Math.round(calmPct)) {
          this.researchTiles.calm.dataset.value = String(calmPct);
          this.animateNumber(this.researchTiles.calm, fromValue, calmPct, 600, (val) => Math.round(val) + "%");
        }
      }

      if (this.researchTiles.sessionTime) {
        const nextText = this.formatDuration(stats.sessionDurationMs || 0);
        if (this.researchTiles.sessionTime.textContent !== nextText) {
          this.researchTiles.sessionTime.textContent = nextText;
        }
      }
    }

    updateMasteryBars(subjectProgress) {
      if (!this.masteryBarList || !subjectProgress) {
        return;
      }

      const signature = JSON.stringify(subjectProgress);
      if (signature === this.lastMasterySignature) {
        return;
      }

      this.lastMasterySignature = signature;
      this.masteryBarList.replaceChildren();

      Object.keys(subjectProgress).forEach((subject) => {
        const entry = subjectProgress[subject];
        const ratio = typeof entry === "number" ? entry : entry.pct;
        const pct = Math.round((ratio || 0) * 100);
        const row = document.createElement("div");
        const label = document.createElement("span");
        const track = document.createElement("div");
        const fill = document.createElement("span");
        const pctLabel = document.createElement("span");

        row.className = "mastery-row";
        label.className = "mastery-label";
        track.className = "mastery-track";
        pctLabel.className = "mastery-pct";
        fill.className = "mastery-fill" + (pct < 33 ? " low" : pct <= 66 ? " medium" : "");

        label.textContent = subject;
        pctLabel.textContent = pct + "%";
        fill.style.width = pct + "%";

        track.appendChild(fill);
        row.append(label, track, pctLabel);
        this.masteryBarList.appendChild(row);
      });
    }

    showToast(message, type = "info", duration = 3000) {
      const prefixes = {
        success: "✓ ",
        warning: "⚠ ",
        info: "",
        calm: "🌿 ",
        error: "⚠ "
      };
      const toast = document.createElement("div");
      toast.className = "toast toast-" + type;
      toast.textContent = (prefixes[type] || "") + message;
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");

      document.body.appendChild(toast);

      window.setTimeout(() => {
        toast.remove();
      }, Math.max(1200, duration) + 450);
    }

    updateSparkline(scoreHistory) {
      if (!this.sparklineCanvas) {
        return;
      }

      const history = Array.isArray(scoreHistory)
        ? scoreHistory.slice(-this.sparklineHistoryLimit).map((value) => this.clamp(Number(value) || 0, 0, 100))
        : [];

      if (!this.sparklineSvg || !this.sparklinePath || !this.sparklineGradientStops) {
        this.initializeSparkline();
      }

      if (!history.length) {
        this.sparklinePath?.setAttribute("d", "");
        return;
      }

      const width = 220;
      const height = 60;
      const min = Math.min.apply(null, history);
      const max = Math.max.apply(null, history);
      const range = Math.max(1, max - min);
      const points = history.map((value, index) => {
        const x = history.length === 1 ? width / 2 : 8 + (index / (history.length - 1)) * (width - 16);
        const y = height - 8 - ((value - min) / range) * (height - 16);
        return { x, y };
      });

      const pathData = points.map((point, index) => (index === 0 ? "M " : "L ") + point.x.toFixed(2) + " " + point.y.toFixed(2)).join(" ");
      const trend = history[history.length - 1] - history[0];
      const gradient = this.getSparklineGradient(trend);

      this.sparklineGradientStops.start.setAttribute("stop-color", gradient.start);
      this.sparklineGradientStops.end.setAttribute("stop-color", gradient.end);
      this.sparklinePath?.setAttribute("d", pathData);
    }

    initializeGauge() {
      this.gaugeTrack?.style.setProperty("strokeDasharray", String(this.gaugeCircumference));
      this.gaugeFill?.style.setProperty("strokeDasharray", String(this.gaugeCircumference));
    }

    initializeSparkline() {
      if (!this.sparklineCanvas) {
        return;
      }

      const namespace = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(namespace, "svg");
      const defs = document.createElementNS(namespace, "defs");
      const gradient = document.createElementNS(namespace, "linearGradient");
      const stopStart = document.createElementNS(namespace, "stop");
      const stopEnd = document.createElementNS(namespace, "stop");
      const path = document.createElementNS(namespace, "path");
      const gradientId = "adaptive-study-sparkline-gradient";

      svg.setAttribute("viewBox", "0 0 220 60");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "60");
      svg.setAttribute("aria-hidden", "true");

      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("x2", "100%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("y2", "0%");

      stopStart.setAttribute("offset", "0%");
      stopEnd.setAttribute("offset", "100%");
      gradient.append(stopStart, stopEnd);
      defs.appendChild(gradient);

      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "url(#" + gradientId + ")");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");

      svg.append(defs, path);
      this.sparklineCanvas.replaceChildren(svg);
      this.sparklineSvg = svg;
      this.sparklinePath = path;
      this.sparklineGradientStops = { start: stopStart, end: stopEnd };
    }

    adjustFlashcardAutoAdvance(mode) {
      if (typeof window.CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("adaptive-study:auto-advance", { detail: { mode } }));
      }
    }

    animateTile(element, value) {
      if (!element) {
        return;
      }

      const safeValue = Number(value) || 0;
      const fromValue = Number(element.dataset.value || 0);

      if (Math.round(fromValue) === Math.round(safeValue)) {
        return;
      }

      element.dataset.value = String(safeValue);
      this.animateNumber(element, fromValue, safeValue, 600, (current) => String(Math.round(current)));
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

    getSparklineGradient(trend) {
      const green = this.getCssVariable("--accent-green", "#6BAF7A");
      const amber = this.getCssVariable("--accent-amber", "#E09A4F");
      const coral = this.getCssVariable("--accent-coral", "#D96B6B");

      if (trend > 5) {
        return { start: green, end: coral };
      }

      if (trend < -5) {
        return { start: coral, end: green };
      }

      return { start: green, end: amber };
    }

    normalizeState(state) {
      return state === "low" || state === "medium" || state === "high" ? state : "medium";
    }

    formatDuration(durationMs) {
      const totalSeconds = Math.floor((Number(durationMs) || 0) / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }

    getCssVariable(name, fallback) {
      const value = getComputedStyle(this.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    }

    hexToRgb(hex) {
      const normalized = hex.replace("#", "");
      const safe = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
      return {
        r: parseInt(safe.slice(0, 2), 16),
        g: parseInt(safe.slice(2, 4), 16),
        b: parseInt(safe.slice(4, 6), 16)
      };
    }

    rgbToHex(rgb) {
      return "#" + [rgb.r, rgb.g, rgb.b].map((value) => value.toString(16).padStart(2, "0")).join("");
    }

    interpolateColor(start, end, ratio) {
      return {
        r: Math.round(start.r + (end.r - start.r) * ratio),
        g: Math.round(start.g + (end.g - start.g) * ratio),
        b: Math.round(start.b + (end.b - start.b) * ratio)
      };
    }

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }
  }

  window.UIAdapter = UIAdapter;
})();
