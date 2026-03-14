(function () {
  "use strict";

  class CognitiveEngine {
    constructor() {
      // Shared timing controls for sampling, metric refresh, and composite smoothing.
      this.metricTickMs = 500;
      this.cursorSampleIntervalMs = 50;
      this.compositeAlpha = 0.3;

      this.cursorEntropy = 0;
      this.hesitationIndex = 0;
      this.errorRate = 0;
      this.scrollRhythm = 0;
      this.compositeScore = null;

      this.engineStartedAt = this.now();
      this.lastMetricsUpdateAt = 0;
      this.lastMouseSampleAt = 0;
      this.lastMouseMoveAt = this.engineStartedAt;
      this.lastHoverPauseMark = 0;
      this.lastInteractionAt = null;

      this.cursorPositions = [];
      this.interactionIntervals = [];
      this.hoverPauseEvents = [];
      this.deleteKeyEvents = [];
      this.correctionEvents = [];
      this.scrollEvents = [];

      this.textSessions = new WeakMap();
      this.scrollTrackers = new Map();

      this.pollingIntervalId = null;
      this.metricIntervalId = null;

      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleScroll = this.handleScroll.bind(this);

      this.startSensorListeners();
      this.refreshMetrics(true);
    }

    startSensorListeners() {
      if (typeof document === "undefined") {
        return;
      }

      document.addEventListener("mousemove", this.handleMouseMove, { passive: true });
      document.addEventListener("click", this.handleClick, { passive: true });
      document.addEventListener("keydown", this.handleKeyDown, { passive: true });
      document.addEventListener("scroll", this.handleScroll, { passive: true, capture: true });

      if (typeof window !== "undefined") {
        // Keep the metrics alive even when the user is idle so the dashboard feels responsive.
        this.metricIntervalId = window.setInterval(() => {
          this.refreshMetrics();
        }, this.metricTickMs);
      }
    }

    handleMouseMove(event) {
      const timestamp = this.now();

      if (timestamp - this.lastMouseSampleAt < this.cursorSampleIntervalMs) {
        this.lastMouseMoveAt = timestamp;
        this.lastHoverPauseMark = 0;
        return;
      }

      this.lastMouseSampleAt = timestamp;
      this.lastMouseMoveAt = timestamp;
      this.lastHoverPauseMark = 0;

      this.cursorPositions.push({
        x: event.clientX,
        y: event.clientY,
        timestamp
      });

      if (this.cursorPositions.length > 20) {
        this.cursorPositions.shift();
      }
    }

    handleClick() {
      this.recordInteraction();
    }

    handleKeyDown(event) {
      const timestamp = this.recordInteraction();
      const target = event.target;

      if (event.key === "Backspace" || event.key === "Delete") {
        this.deleteKeyEvents.push(timestamp);

        if (this.isTextEntryTarget(target)) {
          this.recordCorrectionDelete(target, timestamp);
        }

        return;
      }

      if (this.isTextEntryTarget(target) && this.isPrintableEntry(event, target)) {
        this.recordTypedCharacter(target, timestamp);
      }
    }

    handleScroll(event) {
      const timestamp = this.now();
      const target = this.resolveScrollTarget(event.target);

      if (!target) {
        return;
      }

      const currentPosition = this.getScrollPosition(target);
      const previousState = this.scrollTrackers.get(target);

      if (!previousState) {
        this.scrollTrackers.set(target, {
          position: currentPosition,
          timestamp
        });
        return;
      }

      const delta = currentPosition - previousState.position;
      const deltaTime = Math.max(1, timestamp - previousState.timestamp);

      previousState.position = currentPosition;
      previousState.timestamp = timestamp;

      if (Math.abs(delta) < 1) {
        return;
      }

      this.scrollEvents.push({
        direction: delta > 0 ? 1 : -1,
        speed: Math.abs(delta) / deltaTime,
        timestamp
      });
    }

    recordInteraction() {
      const timestamp = this.now();

      if (this.lastInteractionAt !== null) {
        this.interactionIntervals.push(timestamp - this.lastInteractionAt);
      }

      this.lastInteractionAt = timestamp;

      if (this.interactionIntervals.length > 10) {
        this.interactionIntervals.shift();
      }

      return timestamp;
    }

    recordTypedCharacter(target, timestamp) {
      const session = this.getTextSession(target);

      if (timestamp - session.lastTypedAt > 1800) {
        session.typedSinceDelete = 0;
      }

      // Fresh typing starts a new correction burst window.
      session.deleteStreak = 0;
      session.correctionBurstActive = false;
      session.typedSinceDelete += 1;
      session.lastTypedAt = timestamp;
      this.textSessions.set(target, session);
    }

    recordCorrectionDelete(target, timestamp) {
      const session = this.getTextSession(target);
      const isRecentTyping = timestamp - session.lastTypedAt < 1500 && session.typedSinceDelete >= 2;
      const isSameDeleteBurst = timestamp - session.lastDeleteAt < 900;

      if (isRecentTyping) {
        session.deleteStreak = isSameDeleteBurst ? session.deleteStreak + 1 : 1;
        session.typedSinceDelete = Math.max(0, session.typedSinceDelete - 1);

        if (session.deleteStreak >= 2 && !session.correctionBurstActive) {
          this.correctionEvents.push(timestamp);
          session.correctionBurstActive = true;
        }
      } else {
        session.deleteStreak = 0;
        session.correctionBurstActive = false;
        session.typedSinceDelete = Math.max(0, session.typedSinceDelete - 1);
      }

      session.lastDeleteAt = timestamp;
      this.textSessions.set(target, session);
    }

    refreshMetrics(force) {
      const timestamp = this.now();

      if (!force && timestamp - this.lastMetricsUpdateAt < this.metricTickMs * 0.8) {
        return;
      }

      this.pruneEventWindows(timestamp);
      this.registerHoverPause(timestamp);

      // Each sensor gets a small amount of noise and local smoothing so values do not feel frozen.
      this.cursorEntropy = this.smoothSensorValue(
        this.cursorEntropy,
        this.applyNoise(this.computeCursorEntropy(timestamp)),
        0.35
      );

      this.hesitationIndex = this.smoothSensorValue(
        this.hesitationIndex,
        this.applyNoise(this.computeHesitationIndex(timestamp)),
        0.3
      );

      this.errorRate = this.smoothSensorValue(
        this.errorRate,
        this.applyNoise(this.computeErrorRate()),
        0.4
      );

      this.scrollRhythm = this.smoothSensorValue(
        this.scrollRhythm,
        this.applyNoise(this.computeScrollRhythm(timestamp)),
        0.35
      );

      // Composite load uses the product weights from the spec and an EMA to avoid jumpy UI.
      const rawComposite =
        this.cursorEntropy * 0.25 +
        this.hesitationIndex * 0.35 +
        this.errorRate * 0.25 +
        this.scrollRhythm * 0.15;

      this.compositeScore =
        this.compositeScore === null
          ? rawComposite
          : this.compositeAlpha * rawComposite + (1 - this.compositeAlpha) * this.compositeScore;

      this.compositeScore = this.clamp(this.compositeScore, 0, 100);
      this.lastMetricsUpdateAt = timestamp;
    }

    pruneEventWindows(timestamp) {
      this.hoverPauseEvents = this.hoverPauseEvents.filter((entry) => timestamp - entry <= 10000);
      this.deleteKeyEvents = this.deleteKeyEvents.filter((entry) => timestamp - entry <= 30000);
      this.correctionEvents = this.correctionEvents.filter((entry) => timestamp - entry <= 30000);
      this.scrollEvents = this.scrollEvents.filter((entry) => timestamp - entry.timestamp <= 10000);
    }

    registerHoverPause(timestamp) {
      if (timestamp - this.lastMouseMoveAt <= 2000) {
        return;
      }

      if (this.lastInteractionAt !== null && timestamp - this.lastInteractionAt < 1200) {
        return;
      }

      if (this.lastHoverPauseMark !== 0 && timestamp - this.lastHoverPauseMark < 1000) {
        return;
      }

      this.hoverPauseEvents.push(timestamp);
      this.lastHoverPauseMark = timestamp;
    }

    computeCursorEntropy(timestamp) {
      if (timestamp - this.lastMouseMoveAt > 1800 || this.cursorPositions.length < 3) {
        return 8;
      }

      // Angular deviation between consecutive movement vectors is a simple proxy for cursor jitter.
      const vectors = [];

      for (let index = 1; index < this.cursorPositions.length; index += 1) {
        const previous = this.cursorPositions[index - 1];
        const current = this.cursorPositions[index];
        const deltaX = current.x - previous.x;
        const deltaY = current.y - previous.y;
        const magnitude = Math.hypot(deltaX, deltaY);
        const deltaTime = Math.max(1, current.timestamp - previous.timestamp);

        if (magnitude < 1.5) {
          continue;
        }

        vectors.push({
          x: deltaX,
          y: deltaY,
          magnitude,
          speed: magnitude / deltaTime
        });
      }

      if (vectors.length < 2) {
        return 10;
      }

      let angleSum = 0;
      let angleCount = 0;
      let speedSum = 0;

      for (let index = 1; index < vectors.length; index += 1) {
        const previous = vectors[index - 1];
        const current = vectors[index];
        const dotProduct = previous.x * current.x + previous.y * current.y;
        const magnitudeProduct = previous.magnitude * current.magnitude;
        const cosine = this.clamp(dotProduct / magnitudeProduct, -1, 1);
        const angle = Math.acos(cosine);

        angleSum += angle;
        angleCount += 1;
      }

      for (const vector of vectors) {
        speedSum += vector.speed;
      }

      const averageAngle = angleSum / Math.max(1, angleCount);
      const averageSpeed = speedSum / vectors.length;
      const angleScore = (averageAngle / Math.PI) * 100;
      const speedFactor = this.clamp(this.mapRange(averageSpeed, 0.04, 0.85, 0.18, 1), 0.18, 1);

      return this.clamp(angleScore * speedFactor, 0, 100);
    }

    computeHesitationIndex(timestamp) {
      const recentIntervals = this.interactionIntervals.slice(-9);
      const currentPendingInterval =
        this.lastInteractionAt === null ? timestamp - this.engineStartedAt : timestamp - this.lastInteractionAt;

      recentIntervals.push(currentPendingInterval);

      const averageInterval = this.average(recentIntervals);
      const intervalScore = this.clamp(this.mapRange(averageInterval, 800, 3000, 0, 100), 0, 100);
      const hoverPauseScore = this.clamp(this.mapRange(this.hoverPauseEvents.length, 0, 5, 0, 35), 0, 35);
      const idleMouseMs = timestamp - this.lastMouseMoveAt;
      const idleMouseScore = idleMouseMs > 2000
        ? this.clamp(this.mapRange(idleMouseMs, 2000, 7000, 0, 20), 0, 20)
        : 0;

      return this.clamp(intervalScore * 0.78 + hoverPauseScore + idleMouseScore, 0, 100);
    }

    computeErrorRate() {
      const deleteCount = this.deleteKeyEvents.length;
      const correctionCount = this.correctionEvents.length;
      const weightedErrors = deleteCount + correctionCount * 2;

      return this.clamp((weightedErrors / 15) * 100, 0, 100);
    }

    computeScrollRhythm(timestamp) {
      if (this.scrollEvents.length < 2) {
        return timestamp - this.engineStartedAt < 2000 ? 10 : 6;
      }

      // Fast speed, bursty pace, and frequent reversals usually signal disorientation.
      const speeds = this.scrollEvents.map((event) => event.speed);
      const averageSpeed = this.average(speeds);
      const speedVariance = this.variance(speeds, averageSpeed);

      let directionChanges = 0;
      let upwardMovements = 0;

      for (let index = 0; index < this.scrollEvents.length; index += 1) {
        const current = this.scrollEvents[index];

        if (current.direction < 0) {
          upwardMovements += 1;
        }

        if (index === 0) {
          continue;
        }

        if (current.direction !== this.scrollEvents[index - 1].direction) {
          directionChanges += 1;
        }
      }

      const reversalRatio = directionChanges / Math.max(1, this.scrollEvents.length - 1);
      const upwardRatio = upwardMovements / this.scrollEvents.length;
      const speedScore = this.clamp(this.mapRange(averageSpeed, 0.08, 2.2, 0, 100), 0, 100);
      const reversalScore = reversalRatio * 100;
      const varianceScore = this.clamp(this.mapRange(speedVariance, 0.003, 0.6, 0, 100), 0, 100);

      let rhythmScore = speedScore * 0.45 + reversalScore * 0.35 + varianceScore * 0.2;

      if (upwardRatio < 0.22 && reversalRatio < 0.2) {
        rhythmScore *= 0.72;
      } else {
        rhythmScore += upwardRatio * 18;
      }

      return this.clamp(rhythmScore, 0, 100);
    }

    getMentalLoadScore() {
      this.refreshMetrics();
      return Math.round(this.compositeScore === null ? 0 : this.compositeScore);
    }

    getLoadState() {
      const composite = this.getMentalLoadScore();

      if (composite <= 33) {
        return "low";
      }

      if (composite <= 66) {
        return "medium";
      }

      return "high";
    }

    getMetrics() {
      this.refreshMetrics();

      return {
        cursorEntropy: Math.round(this.cursorEntropy),
        hesitationIndex: Math.round(this.hesitationIndex),
        errorRate: Math.round(this.errorRate),
        scrollRhythm: Math.round(this.scrollRhythm),
        composite: Math.round(this.compositeScore === null ? 0 : this.compositeScore),
        state: this.getLoadState()
      };
    }

    startPolling(callback, intervalMs) {
      if (typeof callback !== "function" || typeof window === "undefined") {
        return;
      }

      this.stopPolling();
      callback(this.getMetrics());

      this.pollingIntervalId = window.setInterval(() => {
        callback(this.getMetrics());
      }, intervalMs || 500);
    }

    stopPolling() {
      if (this.pollingIntervalId === null || typeof window === "undefined") {
        return;
      }

      window.clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    getTextSession(target) {
      return (
        this.textSessions.get(target) || {
          typedSinceDelete: 0,
          lastTypedAt: 0,
          lastDeleteAt: 0,
          deleteStreak: 0,
          correctionBurstActive: false
        }
      );
    }

    isPrintableEntry(event, target) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return false;
      }

      if (event.key === "Enter") {
        return typeof HTMLTextAreaElement !== "undefined" && target instanceof HTMLTextAreaElement;
      }

      return event.key.length === 1;
    }

    isTextEntryTarget(target) {
      if (!target || typeof HTMLElement === "undefined") {
        return false;
      }

      if (typeof HTMLTextAreaElement !== "undefined" && target instanceof HTMLTextAreaElement) {
        return true;
      }

      if (typeof HTMLInputElement !== "undefined" && target instanceof HTMLInputElement) {
        const type = (target.type || "text").toLowerCase();
        return [
          "text",
          "search",
          "email",
          "url",
          "tel",
          "password",
          "number"
        ].includes(type);
      }

      return target instanceof HTMLElement && target.isContentEditable;
    }

    resolveScrollTarget(target) {
      if (typeof document === "undefined") {
        return null;
      }

      if (
        !target ||
        target === document ||
        target === document.body ||
        target === document.documentElement
      ) {
        return document.scrollingElement || document.documentElement;
      }

      return target;
    }

    getScrollPosition(target) {
      if (!target) {
        return 0;
      }

      if (typeof window !== "undefined" && target === window) {
        return window.scrollY || 0;
      }

      return typeof target.scrollTop === "number" ? target.scrollTop : 0;
    }

    smoothSensorValue(previousValue, nextValue, alpha) {
      const safePrevious = Number.isFinite(previousValue) ? previousValue : 0;
      const safeNext = Number.isFinite(nextValue) ? nextValue : 0;
      return this.clamp(safePrevious * (1 - alpha) + safeNext * alpha, 0, 100);
    }

    applyNoise(value) {
      return this.clamp(value + (Math.random() * 4 - 2), 0, 100);
    }

    average(values) {
      if (!values.length) {
        return 0;
      }

      let total = 0;

      for (const value of values) {
        total += value;
      }

      return total / values.length;
    }

    variance(values, mean) {
      if (!values.length) {
        return 0;
      }

      let total = 0;

      for (const value of values) {
        total += (value - mean) * (value - mean);
      }

      return total / values.length;
    }

    mapRange(value, inputMin, inputMax, outputMin, outputMax) {
      if (inputMax === inputMin) {
        return outputMin;
      }

      const ratio = (value - inputMin) / (inputMax - inputMin);
      return outputMin + ratio * (outputMax - outputMin);
    }

    clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }

    now() {
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
      }

      return Date.now();
    }
  }

  window.CognitiveEngine = CognitiveEngine;
})();
