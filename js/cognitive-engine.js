(function () {
  "use strict";

  class CognitiveEngine {
    constructor() {
      this.metricTickMs = 500;
      this.cursorSampleIntervalMs = 50;
      this.compositeAlpha = 0.3;
      this.noiseLevel = 2;
      this.demoMode = false;

      this.cursorEntropy = 0;
      this.hesitationIndex = 0;
      this.errorRate = 0;
      this.scrollRhythm = 0;
      this.compositeScore = 0;

      this.engineStartedAt = this.now();
      this.lastMetricsUpdateAt = 0;
      this.lastMouseSampleAt = 0;
      this.lastMouseMoveAt = this.engineStartedAt;
      this.lastHoverPauseMark = 0;
      this.lastInteractionAt = null;
      this.lastState = null;
      this.lastStateTickAt = 0;

      this.cursorPositions = [];
      this.interactionIntervals = [];
      this.hoverPauseEvents = [];
      this.deleteKeyEvents = [];
      this.correctionEvents = [];
      this.scrollEvents = [];
      this.textSessions = new WeakMap();
      this.scrollTrackers = new Map();

      this.eventCounts = {
        mouseMove: 0,
        click: 0,
        keystroke: 0,
        scroll: 0
      };

      this.sessionStartTime = null;
      this.sessionMin = null;
      this.sessionMax = null;
      this.sessionAvg = 0;
      this.sessionAvgInitialized = false;
      this.sessionScoreHistory = [];
      this.timeInLow = 0;
      this.timeInMedium = 0;
      this.timeInHigh = 0;
      this.modeSwitchCount = 0;

      this.isCalibrating = false;
      this.calibrationComplete = false;
      this.calibrationProgress = 0;
      this.calibrationStartedAt = null;
      this.calibrationDurationMs = 15000;
      this.calibrationSamples = [];
      this.baselineCursor = 0;
      this.baselineHesitation = 0;
      this.baselineScroll = 0;
      this.calibrationCallbacks = [];
      this.calibrationTimeoutId = null;

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
        this.metricIntervalId = window.setInterval(() => {
          this.refreshMetrics();
        }, this.metricTickMs);
      }
    }

    handleMouseMove(event) {
      const timestamp = this.now();
      this.eventCounts.mouseMove += 1;

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
      this.eventCounts.click += 1;
      this.recordInteraction();
    }

    handleKeyDown(event) {
      const timestamp = this.recordInteraction();
      const target = event.target;

      this.eventCounts.keystroke += 1;

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

      this.eventCounts.scroll += 1;

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

      const rawCursor = this.computeCursorEntropy(timestamp);
      const rawHesitation = this.computeHesitationIndex(timestamp);
      const rawError = this.computeErrorRate();
      const rawScroll = this.computeScrollRhythm(timestamp);

      if (this.isCalibrating && !this.calibrationComplete) {
        this.captureCalibrationSample(rawCursor, rawHesitation, rawScroll, timestamp);
      }

      const cursorBase = this.calibrationComplete ? this.baselineCursor : 0;
      const hesitationBase = this.calibrationComplete ? this.baselineHesitation : 0;
      const scrollBase = this.calibrationComplete ? this.baselineScroll : 0;

      this.cursorEntropy = this.smoothSensorValue(
        this.cursorEntropy,
        this.applyNoise(this.clamp(rawCursor - cursorBase + 12, 0, 100)),
        0.35
      );
      this.hesitationIndex = this.smoothSensorValue(
        this.hesitationIndex,
        this.applyNoise(this.clamp(rawHesitation - hesitationBase + 12, 0, 100)),
        0.3
      );
      this.errorRate = this.smoothSensorValue(this.errorRate, this.applyNoise(rawError), 0.4);
      this.scrollRhythm = this.smoothSensorValue(
        this.scrollRhythm,
        this.applyNoise(this.clamp(rawScroll - scrollBase + 10, 0, 100)),
        0.35
      );

      const rawComposite =
        this.cursorEntropy * 0.25 +
        this.hesitationIndex * 0.35 +
        this.errorRate * 0.25 +
        this.scrollRhythm * 0.15;

      this.compositeScore =
        this.compositeScore === null || Number.isNaN(this.compositeScore)
          ? rawComposite
          : this.compositeAlpha * rawComposite + (1 - this.compositeAlpha) * this.compositeScore;

      this.compositeScore = this.clamp(this.compositeScore, 0, 100);
      this.lastMetricsUpdateAt = timestamp;

      if (this.calibrationComplete && this.sessionStartTime !== null) {
        this.updateSessionStats(timestamp);
      }
    }

    captureCalibrationSample(cursor, hesitation, scroll, timestamp) {
      if (this.calibrationStartedAt === null) {
        this.calibrationStartedAt = timestamp;
      }

      this.calibrationSamples.push({
        cursor,
        hesitation,
        scroll
      });

      const elapsed = timestamp - this.calibrationStartedAt;
      this.calibrationProgress = this.clamp((elapsed / this.calibrationDurationMs) * 100, 0, 100);

      if (elapsed >= this.calibrationDurationMs || this.demoMode) {
        this.completeCalibration();
      }
    }

    completeCalibration() {
      if (this.calibrationComplete) {
        return;
      }

      this.clearCalibrationTimeout();
      this.isCalibrating = false;
      this.calibrationComplete = true;
      this.calibrationProgress = 100;
      this.baselineCursor = this.average(this.calibrationSamples.map((sample) => sample.cursor));
      this.baselineHesitation = this.average(this.calibrationSamples.map((sample) => sample.hesitation));
      this.baselineScroll = this.average(this.calibrationSamples.map((sample) => sample.scroll));

      const payload = this.buildCalibrationPayload();

      for (const callback of this.calibrationCallbacks) {
        if (typeof callback === "function") {
          callback(payload);
        }
      }
    }

    updateSessionStats(timestamp) {
      const state = this.getLoadStateFromScore(this.compositeScore);

      if (this.lastStateTickAt === 0) {
        this.lastStateTickAt = timestamp;
      }

      const delta = Math.max(0, timestamp - this.lastStateTickAt);

      if (this.lastState === "low") {
        this.timeInLow += delta;
      } else if (this.lastState === "medium") {
        this.timeInMedium += delta;
      } else if (this.lastState === "high") {
        this.timeInHigh += delta;
      }

      if (this.lastState && this.lastState !== state) {
        this.modeSwitchCount += 1;
      }

      this.lastState = state;
      this.lastStateTickAt = timestamp;
      this.sessionMin = this.sessionMin === null ? this.compositeScore : Math.min(this.sessionMin, this.compositeScore);
      this.sessionMax = this.sessionMax === null ? this.compositeScore : Math.max(this.sessionMax, this.compositeScore);

      if (!this.sessionAvgInitialized) {
        this.sessionAvg = this.compositeScore;
        this.sessionAvgInitialized = true;
      } else {
        this.sessionAvg = this.sessionAvg * 0.92 + this.compositeScore * 0.08;
      }

      this.sessionScoreHistory.push(Math.round(this.compositeScore));

      if (this.sessionScoreHistory.length > 500) {
        this.sessionScoreHistory.shift();
      }
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
      let speedSum = 0;

      for (let index = 1; index < vectors.length; index += 1) {
        const previous = vectors[index - 1];
        const current = vectors[index];
        const dotProduct = previous.x * current.x + previous.y * current.y;
        const magnitudeProduct = previous.magnitude * current.magnitude;
        const cosine = this.clamp(dotProduct / magnitudeProduct, -1, 1);
        angleSum += Math.acos(cosine);
      }

      for (const vector of vectors) {
        speedSum += vector.speed;
      }

      const averageAngle = angleSum / Math.max(1, vectors.length - 1);
      const averageSpeed = speedSum / vectors.length;
      const angleScore = (averageAngle / Math.PI) * 100;
      const speedFactor = this.clamp(this.mapRange(averageSpeed, 0.04, 0.85, 0.18, 1), 0.18, 1);

      return this.clamp(angleScore * speedFactor, 0, 100);
    }

    computeHesitationIndex(timestamp) {
      const recentIntervals = this.interactionIntervals.slice(-9);
      const pending = this.lastInteractionAt === null ? timestamp - this.engineStartedAt : timestamp - this.lastInteractionAt;
      recentIntervals.push(pending);

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
      const weightedErrors = this.deleteKeyEvents.length + this.correctionEvents.length * 2;
      return this.clamp((weightedErrors / 15) * 100, 0, 100);
    }

    computeScrollRhythm(timestamp) {
      if (this.scrollEvents.length < 2) {
        return timestamp - this.engineStartedAt < 2000 ? 10 : 6;
      }

      const speeds = this.scrollEvents.map((entry) => entry.speed);
      const averageSpeed = this.average(speeds);
      const speedVariance = this.variance(speeds, averageSpeed);

      let directionChanges = 0;
      let upwardMovements = 0;

      for (let index = 0; index < this.scrollEvents.length; index += 1) {
        const current = this.scrollEvents[index];

        if (current.direction < 0) {
          upwardMovements += 1;
        }

        if (index > 0 && current.direction !== this.scrollEvents[index - 1].direction) {
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
      return Math.round(this.compositeScore);
    }

    getLoadState() {
      return this.getLoadStateFromScore(this.getMentalLoadScore());
    }

    getLoadStateFromScore(score) {
      if (score <= 33) {
        return "low";
      }

      if (score <= 66) {
        return "medium";
      }

      return "high";
    }

    getMetrics() {
      this.refreshMetrics();
      const metrics = {
        cursorEntropy: Math.round(this.cursorEntropy),
        hesitationIndex: Math.round(this.hesitationIndex),
        errorRate: Math.round(this.errorRate),
        scrollRhythm: Math.round(this.scrollRhythm),
        composite: Math.round(this.compositeScore),
        state: this.getLoadStateFromScore(this.compositeScore),
        confidence: this.getConfidence()
      };

      if (this.isCalibrating && !this.calibrationComplete) {
        metrics.calibrating = true;
        metrics.progress = Math.round(this.calibrationProgress);
      }

      return metrics;
    }

    getConfidence() {
      const weights = {
        mouseMove: 0.35,
        click: 0.15,
        keystroke: 0.25,
        scroll: 0.25
      };

      const normalized =
        this.clamp((this.eventCounts.mouseMove / 80) * 100, 0, 100) * weights.mouseMove +
        this.clamp((this.eventCounts.click / 20) * 100, 0, 100) * weights.click +
        this.clamp((this.eventCounts.keystroke / 40) * 100, 0, 100) * weights.keystroke +
        this.clamp((this.eventCounts.scroll / 30) * 100, 0, 100) * weights.scroll;

      return Math.round(this.clamp(normalized, 0, 100));
    }

    getSignalQuality() {
      return {
        cursor: Math.round(this.clamp((this.eventCounts.mouseMove / 80) * 100, 0, 100)),
        hesitation: Math.round(this.clamp(((this.eventCounts.click + this.eventCounts.keystroke) / 50) * 100, 0, 100)),
        error: Math.round(this.clamp((this.eventCounts.keystroke / 40) * 100, 0, 100)),
        scroll: Math.round(this.clamp((this.eventCounts.scroll / 30) * 100, 0, 100))
      };
    }

    getSessionStats() {
      const durationMs = this.sessionStartTime ? this.now() - this.sessionStartTime : 0;

      return {
        min: this.sessionMin === null ? 0 : Math.round(this.sessionMin),
        max: this.sessionMax === null ? 0 : Math.round(this.sessionMax),
        avg: this.sessionAvgInitialized ? Math.round(this.sessionAvg) : 0,
        timeInLow: this.timeInLow,
        timeInMedium: this.timeInMedium,
        timeInHigh: this.timeInHigh,
        modeSwitchCount: this.modeSwitchCount,
        durationMs,
        confidence: this.getConfidence()
      };
    }

    getEventCounts() {
      return Object.assign({}, this.eventCounts);
    }

    setNoiseLevel(level) {
      this.noiseLevel = Math.max(0, Number(level) || 0);
    }

    setDemoMode(isDemo) {
      this.demoMode = Boolean(isDemo);

      if (this.demoMode) {
        this.setNoiseLevel(0);

        if (!this.calibrationComplete) {
          this.isCalibrating = true;
          this.completeCalibration();
        }
      } else {
        this.setNoiseLevel(2);
      }
    }

    onCalibrationComplete(callback) {
      if (typeof callback !== "function") {
        return;
      }

      if (this.calibrationComplete) {
        callback(this.buildCalibrationPayload());
        return;
      }

      this.calibrationCallbacks.push(callback);
    }

    startPolling(callback, intervalMs = 500) {
      if (typeof callback !== "function" || typeof window === "undefined") {
        return;
      }

      this.stopPolling();

      if (this.sessionStartTime === null) {
        this.sessionStartTime = this.now();
        this.lastStateTickAt = this.sessionStartTime;
      }

      if (!this.calibrationComplete && !this.isCalibrating) {
        this.isCalibrating = true;
        this.calibrationStartedAt = this.now();
        this.calibrationSamples = [];
        this.scheduleCalibrationTimeout();
      }

      callback(this.getMetrics());

      this.pollingIntervalId = window.setInterval(() => {
        callback(this.getMetrics());
      }, intervalMs);
    }

    stopPolling() {
      if (this.pollingIntervalId !== null && typeof window !== "undefined") {
        window.clearInterval(this.pollingIntervalId);
      }

      this.pollingIntervalId = null;
    }

    scheduleCalibrationTimeout() {
      if (typeof window === "undefined") {
        return;
      }

      this.clearCalibrationTimeout();
      this.calibrationTimeoutId = window.setTimeout(() => {
        if (!this.calibrationComplete) {
          this.calibrationProgress = 100;
          this.completeCalibration();
        }
      }, this.calibrationDurationMs + 500);
    }

    clearCalibrationTimeout() {
      if (this.calibrationTimeoutId !== null && typeof window !== "undefined") {
        window.clearTimeout(this.calibrationTimeoutId);
      }

      this.calibrationTimeoutId = null;
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

    buildCalibrationPayload() {
      return {
        baselines: {
          cursor: Math.round(this.baselineCursor),
          hesitation: Math.round(this.baselineHesitation),
          scroll: Math.round(this.baselineScroll)
        },
        confidence: this.getConfidence()
      };
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
        return ["text", "search", "email", "url", "tel", "password", "number"].includes(type);
      }

      return target instanceof HTMLElement && target.isContentEditable;
    }

    resolveScrollTarget(target) {
      if (typeof document === "undefined") {
        return null;
      }

      if (!target || target === document || target === document.body || target === document.documentElement) {
        return document.scrollingElement || document.documentElement;
      }

      return target instanceof Element ? target : document.scrollingElement || document.documentElement;
    }

    getScrollPosition(target) {
      if (!target) {
        return 0;
      }

      if ("scrollTop" in target) {
        return Number(target.scrollTop) || 0;
      }

      return 0;
    }

    applyNoise(value) {
      if (this.noiseLevel <= 0 || this.demoMode) {
        return this.clamp(value, 0, 100);
      }

      const noise = (Math.random() * 2 - 1) * this.noiseLevel;
      return this.clamp(value + noise, 0, 100);
    }

    smoothSensorValue(previous, next, alpha) {
      return previous === 0 ? next : previous * (1 - alpha) + next * alpha;
    }

    average(values) {
      if (!values.length) {
        return 0;
      }

      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    variance(values, mean) {
      if (!values.length) {
        return 0;
      }

      return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    }

    mapRange(value, inMin, inMax, outMin, outMax) {
      if (inMax === inMin) {
        return outMin;
      }

      const ratio = (value - inMin) / (inMax - inMin);
      return outMin + ratio * (outMax - outMin);
    }

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    now() {
      return typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    }
  }

  window.CognitiveEngine = CognitiveEngine;
})();
