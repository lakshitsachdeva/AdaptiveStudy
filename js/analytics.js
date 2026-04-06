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

    generateReportHTML(options = {}) {
      const stats = this.getStats();
      const content = window.StudyContent;
      const summary = content && typeof content.getSessionSummary === "function" ? content.getSessionSummary() : null;
      const mastery = summary ? summary.subjectMastery : {};
      const struggleCards = summary ? summary.struggleCards : [];
      const history = this.getLoadHistory();
      const sparkline = this.toTextSparkline(history);
      const duration = this.formatDuration(stats.sessionDurationMs);
      const userName = options.userName ? this.escape(options.userName) : "Learner";
      const topSubject = summary?.topSubject || "Still emerging";
      const weakSubject = summary?.weakSubject || "None yet";
      const avgConfidence = summary?.avgConfidence ? (summary.avgConfidence / 3) * 100 : 0;
      const recommendation = stats.calmModePct > 35
        ? "The learner spent substantial time in high-load states. Future sessions should begin with easier warm-up cards and shorter blocks."
        : "The learner remained relatively stable. Future sessions can gradually introduce more medium and hard cards earlier in the block.";
      const timeline = this.events.slice(-20).map((event) => {
        return "<li><strong>" + this.formatTime(event.timestamp) + "</strong><span>" + this.escape(event.type.replace(/_/g, " ")) + "</span></li>";
      }).join("");
      const masteryRows = Object.keys(mastery).map((subject) => {
        return "<tr><td>" + this.escape(subject) + "</td><td>" + Math.round(mastery[subject].pct * 100) + "%</td><td>" + this.escape(mastery[subject].level) + "</td></tr>";
      }).join("");
      const struggleRows = struggleCards.map((card) => {
        return "<li><strong>" + this.escape(card.subject) + ":</strong> " + this.escape(card.question) + "</li>";
      }).join("");

      return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>AdaptiveStudy — Session Report</title>" +
        "<style>" +
        "body{margin:0;background:#FAF8F3;color:#2C2C2C;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}" +
        ".wrap{max-width:840px;margin:0 auto;padding:18mm 14mm 18mm;}" +
        ".hero{padding:22px 24px;border-radius:22px;background:linear-gradient(135deg,#ffffff,#f6f1e8);border:1px solid #E8E4DC;box-shadow:0 10px 30px rgba(0,0,0,0.08);page-break-inside:avoid;}" +
        "h1,h2,h3{font-family:'Playfair Display',serif;margin:0;}" +
        ".hero h1{font-size:34px;line-height:1.08;}" +
        ".hero p{margin-top:10px;color:#7A7670;line-height:1.65;max-width:62ch;font-size:14px;}" +
        ".meta{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;color:#7A7670;font-size:11px;text-transform:uppercase;letter-spacing:.08em;}" +
        ".grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0;page-break-inside:avoid;}" +
        ".tile{padding:14px 14px 12px;border-radius:16px;background:#fff;border:1px solid #E8E4DC;box-shadow:0 6px 18px rgba(0,0,0,0.05);}" +
        ".tile span{display:block;color:#B0ADA6;font-size:11px;letter-spacing:.08em;text-transform:uppercase;}" +
        ".tile strong{display:block;margin-top:6px;font-family:'Playfair Display',serif;font-size:24px;}" +
        ".report-grid{display:grid;grid-template-columns:1fr;gap:12px;}" +
        ".card{padding:16px;border-radius:18px;background:#fff;border:1px solid #E8E4DC;box-shadow:0 6px 18px rgba(0,0,0,0.05);page-break-inside:avoid;}" +
        ".card h2{font-size:23px;margin-bottom:10px;}" +
        ".card p{color:#7A7670;line-height:1.65;font-size:13px;}" +
        ".accent{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#EAF4ED;color:#4A8A59;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px;}" +
        ".spark{padding:14px;border-radius:14px;background:#F2EFE7;font-size:18px;overflow:auto;letter-spacing:.1em;color:#4A7B95;}" +
        "table{width:100%;border-collapse:collapse;}th,td{padding:9px 0;border-bottom:1px solid #E8E4DC;text-align:left;font-size:13px;}th{font-size:10px;color:#B0ADA6;text-transform:uppercase;letter-spacing:.08em;}" +
        "ul{margin:0;padding-left:18px;color:#7A7670;line-height:1.65;font-size:13px;}" +
        ".timeline{display:grid;gap:10px;padding:0;list-style:none;}" +
        ".timeline li{display:grid;grid-template-columns:88px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #E8E4DC;color:#7A7670;font-size:12px;}" +
        ".rec{margin-top:14px;padding:12px 14px;border-radius:14px;background:#FBF0E3;color:#C07A2F;line-height:1.65;font-size:13px;}" +
        ".footer{margin-top:16px;color:#B0ADA6;font-size:11px;text-align:center;}" +
        "@page{size:A4 portrait;margin:12mm;}" +
        "@media print{body{background:#fff;} .wrap{max-width:none;padding:0;} .hero,.tile,.card{box-shadow:none;} .hero{border-bottom:2px solid #E8E4DC;} .grid{grid-template-columns:repeat(2,minmax(0,1fr));} .report-grid{grid-template-columns:1fr;} }" +
        "</style></head><body><div class='wrap'>" +
        "<section class='hero'>" +
        "<div class='accent'>AdaptiveStudy Session Report</div>" +
        "<h1>Amazing work, " + userName + ".</h1>" +
        "<p>This report captures your study flow, how your cognitive load changed through the session, and where the interface adapted to support focus and recovery.</p>" +
        "<div class='meta'><span>Date: " + this.escape(new Date().toLocaleString()) + "</span><span>Duration: " + this.escape(duration) + "</span><span>Top Subject: " + this.escape(topSubject) + "</span></div>" +
        "</section>" +
        "<div class='grid'>" +
        "<div class='tile'><span>Average Load</span><strong>" + Math.round(stats.avgLoadScore) + "</strong></div>" +
        "<div class='tile'><span>Peak Load</span><strong>" + Math.round(stats.peakLoadScore) + "</strong></div>" +
        "<div class='tile'><span>Calm Time</span><strong>" + Math.round(stats.calmModePct) + "%</strong></div>" +
        "<div class='tile'><span>Confidence</span><strong>" + Math.round(avgConfidence) + "%</strong></div>" +
        "</div>" +
        "<div class='report-grid'>" +
        "<div class='card'><h2>Load History</h2><p>The sparkline below shows how the mental load score evolved through the session.</p><div class='spark'>" + this.escape(sparkline) + "</div><div class='rec'><strong>Observation:</strong> " + this.escape(recommendation) + "</div></div>" +
        "<div class='card'><h2>Session Snapshot</h2><table><tbody>" +
        "<tr><th>Cards Seen</th><td>" + stats.cardsSeen + "</td></tr>" +
        "<tr><th>Cards Learned</th><td>" + stats.cardsLearned + "</td></tr>" +
        "<tr><th>Review Later</th><td>" + stats.cardsReview + "</td></tr>" +
        "<tr><th>Mode Switches</th><td>" + stats.modeSwitchCount + "</td></tr>" +
        "<tr><th>Strongest Subject</th><td>" + this.escape(topSubject) + "</td></tr>" +
        "<tr><th>Needs Review</th><td>" + this.escape(weakSubject) + "</td></tr>" +
        "</tbody></table></div>" +
        "<div class='card'><h2>Subject Mastery</h2><table><thead><tr><th>Subject</th><th>Mastery</th><th>Level</th></tr></thead><tbody>" + masteryRows + "</tbody></table></div>" +
        "<div class='card'><h2>Struggle Cards</h2><ul>" + (struggleRows || "<li>No struggle cards recorded yet.</li>") + "</ul></div>" +
        "<div class='card'><h2>Session Timeline</h2><ul class='timeline'>" + timeline + "</ul></div>" +
        "</div><div class='footer'>Printed from AdaptiveStudy — Cognitive Load-Aware Study Dashboard</div></div></body></html>";
    }

    exportReport(options = {}) {
      const html = this.generateReportHTML(options);
      const reportWindow = window.open("about:blank", "_blank");

      if (reportWindow) {
        reportWindow.document.open();
        reportWindow.document.write(html);
        reportWindow.document.close();

        window.setTimeout(() => {
          try {
            reportWindow.focus();
            reportWindow.print();
          } catch (error) {
            console.warn("[AdaptiveStudy] Print unavailable:", error);
          }
        }, 500);

        return { success: true, mode: "popup" };
      }

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "AdaptiveStudy-Session-Report.html";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { success: true, mode: "download" };
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
