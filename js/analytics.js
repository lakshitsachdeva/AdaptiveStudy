(function () {
  "use strict";

  class SessionAnalytics {
    constructor() {
      this.events = [];
      this.startedAt = Date.now();
      this.totalSamples = 0;
      this.scoreSum = 0;
      this.minLoadScore = null;
      this.peakLoadScore = null;
      this.lastState = null;
      this.lastStateAt = Date.now();
      this.timeInLow = 0;
      this.timeInMedium = 0;
      this.timeInHigh = 0;
      this.modeSwitchCount = 0;
      this.loadHistory = [];
      this.calibrated = false;

      this.logEvent("session_start");
    }

    logEvent(type, data = {}) {
      this.events.push({
        timestamp: Date.now(),
        type,
        data
      });

      if (this.events.length > 500) {
        this.events.shift();
      }
    }

    logLoadSample(score, state) {
      const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
      const safeState = state === "low" || state === "medium" || state === "high" ? state : "medium";
      const now = Date.now();
      const delta = now - this.lastStateAt;

      if (this.lastState === "low") {
        this.timeInLow += delta;
      } else if (this.lastState === "medium") {
        this.timeInMedium += delta;
      } else if (this.lastState === "high") {
        this.timeInHigh += delta;
      }

      if (this.lastState && this.lastState !== safeState) {
        this.modeSwitchCount += 1;
      }

      this.lastState = safeState;
      this.lastStateAt = now;
      this.totalSamples += 1;
      this.scoreSum += safeScore;
      this.minLoadScore = this.minLoadScore === null ? safeScore : Math.min(this.minLoadScore, safeScore);
      this.peakLoadScore = this.peakLoadScore === null ? safeScore : Math.max(this.peakLoadScore, safeScore);
      this.loadHistory.push(Math.round(safeScore));

      if (this.loadHistory.length > 60) {
        this.loadHistory.shift();
      }

      this.logEvent("load_sample", { score: Math.round(safeScore), state: safeState });
    }

    getStats() {
      const sessionDurationMs = Date.now() - this.startedAt;
      const confidenceRatings = this.events
        .filter((entry) => entry.type === "confidence_rated")
        .map((entry) => Number(entry.data.rating) || 0)
        .filter(Boolean);
      const cardsSeen = this.events.filter((entry) => entry.type === "card_seen").length;
      const cardsLearned = this.events.filter((entry) => entry.type === "card_learned").length;
      const cardsReview = this.events.filter((entry) => entry.type === "card_review").length;
      const avgConfidence = confidenceRatings.length
        ? confidenceRatings.reduce((sum, value) => sum + value, 0) / confidenceRatings.length
        : null;
      const totalTrackedTime = this.timeInLow + this.timeInMedium + this.timeInHigh;

      return {
        sessionDurationMs,
        avgLoadScore: this.totalSamples ? this.scoreSum / this.totalSamples : 0,
        peakLoadScore: this.peakLoadScore || 0,
        minLoadScore: this.minLoadScore || 0,
        timeInLow: this.timeInLow,
        timeInMedium: this.timeInMedium,
        timeInHigh: this.timeInHigh,
        calmModePct: totalTrackedTime ? (this.timeInHigh / totalTrackedTime) * 100 : 0,
        modeSwitchCount: this.modeSwitchCount,
        cardsSeen,
        cardsLearned,
        cardsReview,
        avgConfidence,
        calibrated: this.calibrated,
        eventLog: this.events.slice(-100)
      };
    }

    getLoadHistory() {
      return this.loadHistory.slice(-60);
    }

    generateReportHTML() {
      const stats = this.getStats();
      const content = window.StudyContent;
      const summary = content && typeof content.getSessionSummary === "function" ? content.getSessionSummary() : null;
      const mastery = summary ? summary.subjectMastery : {};
      const struggleCards = summary ? summary.struggleCards : [];
      const history = this.getLoadHistory();
      const sparkline = this.toTextSparkline(history);
      const duration = this.formatDuration(stats.sessionDurationMs);
      const timeline = this.events.slice(-20).map((event) => {
        return "<li><strong>" + this.formatTime(event.timestamp) + "</strong> — " + this.escape(event.type.replace(/_/g, " ")) + "</li>";
      }).join("");
      const masteryRows = Object.keys(mastery).map((subject) => {
        return "<tr><td>" + this.escape(subject) + "</td><td>" + Math.round(mastery[subject].pct * 100) + "%</td><td>" + this.escape(mastery[subject].level) + "</td></tr>";
      }).join("");
      const struggleRows = struggleCards.map((card) => {
        return "<li><strong>" + this.escape(card.subject) + ":</strong> " + this.escape(card.question) + "</li>";
      }).join("");

      return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>AdaptiveStudy — Session Report</title>" +
        "<style>" +
        "body{margin:0;padding:32px;background:#FAF8F3;color:#2C2C2C;font-family:'DM Sans',sans-serif;}" +
        "h1,h2,h3{font-family:'Playfair Display',serif;margin:0 0 10px;}" +
        ".wrap{max-width:960px;margin:0 auto;}" +
        ".grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin:24px 0;}" +
        ".tile,.card{background:#fff;border:1px solid #E8E4DC;border-radius:14px;padding:18px;box-shadow:0 2px 16px rgba(0,0,0,0.06);}" +
        ".tile strong{display:block;font-size:28px;font-family:'Playfair Display',serif;}" +
        "table{width:100%;border-collapse:collapse;}td,th{padding:10px;border-bottom:1px solid #E8E4DC;text-align:left;}" +
        "ul{padding-left:18px;}pre{background:#F2EFE7;padding:14px;border-radius:10px;overflow:auto;}" +
        "</style></head><body><div class='wrap'>" +
        "<h1>AdaptiveStudy — Session Report</h1>" +
        "<p>Date: " + this.escape(new Date().toLocaleString()) + "</p>" +
        "<p>Duration: " + this.escape(duration) + "</p>" +
        "<div class='grid'>" +
        "<div class='tile'><span>Avg Load</span><strong>" + Math.round(stats.avgLoadScore) + "</strong></div>" +
        "<div class='tile'><span>Peak Load</span><strong>" + Math.round(stats.peakLoadScore) + "</strong></div>" +
        "<div class='tile'><span>Calm Time</span><strong>" + Math.round(stats.calmModePct) + "%</strong></div>" +
        "<div class='tile'><span>Cards Learned</span><strong>" + stats.cardsLearned + "</strong></div>" +
        "</div>" +
        "<div class='card'><h2>Load History</h2><pre>" + this.escape(sparkline) + "</pre></div>" +
        "<div class='card'><h2>Subject Mastery</h2><table><thead><tr><th>Subject</th><th>Mastery</th><th>Level</th></tr></thead><tbody>" + masteryRows + "</tbody></table></div>" +
        "<div class='card'><h2>Top Struggle Cards</h2><ul>" + (struggleRows || "<li>No struggle cards recorded yet.</li>") + "</ul></div>" +
        "<div class='card'><h2>Session Event Log</h2><ul>" + timeline + "</ul></div>" +
        "</div></body></html>";
    }

    exportReport() {
      const html = this.generateReportHTML();
      const reportWindow = window.open("", "_blank", "noopener,noreferrer");

      if (!reportWindow) {
        return;
      }

      reportWindow.document.write(html);
      reportWindow.document.close();

      window.setTimeout(() => {
        try {
          reportWindow.print();
        } catch (error) {
          console.warn("[AdaptiveStudy] Print unavailable:", error);
        }
      }, 350);
    }

    toTextSparkline(values) {
      const blocks = "▁▂▃▄▅▆▇█";

      if (!values.length) {
        return "No load samples yet.";
      }

      return values.map((value) => {
        const index = Math.min(blocks.length - 1, Math.max(0, Math.round((value / 100) * (blocks.length - 1))));
        return blocks[index];
      }).join("");
    }

    formatDuration(durationMs) {
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    }

    escape(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  }

  window.SessionAnalytics = new SessionAnalytics();
})();
