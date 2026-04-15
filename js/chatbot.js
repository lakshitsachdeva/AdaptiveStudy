(function () {
  "use strict";

  class AdaptiveStudyChatbot {
    constructor() {
      this.form = document.getElementById("chat-form");
      this.input = document.getElementById("chat-input");
      this.messages = document.getElementById("chat-messages");
      this.sendButton = document.getElementById("btn-send-chat");
      this.status = document.getElementById("chat-status");
      this.history = [];
      this.pending = false;
      this.localEnvironment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "";

      if (!this.form || !this.input || !this.messages || !this.sendButton) {
        return;
      }

      if (this.localEnvironment) {
        this.setBusyState(false, "Local study helper active. Gemini is only used on the deployed app.");
        this.input.placeholder = "Ask for summaries, mnemonics, or help with the current card.";
      }

      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        this.sendMessage();
      });
    }

    async sendMessage() {
      const message = this.input?.value.trim();

      if (!message || this.pending) {
        return;
      }

      this.pending = true;
      this.setBusyState(true, this.localEnvironment ? "Thinking locally..." : "Sending...");
      this.appendMessage("user", message);
      this.input.value = "";

      const assistantPlaceholder = this.appendMessage("assistant", "Thinking...");

      if (this.localEnvironment) {
        window.setTimeout(() => {
          const reply = this.generateLocalReply(message);
          assistantPlaceholder.querySelector("p").textContent = reply;
          this.history.push(
            { role: "user", content: message },
            { role: "assistant", content: reply }
          );
          this.history = this.history.slice(-12);
          this.pending = false;
          this.setBusyState(false, "Local study helper active. No API cost on localhost.");
        }, 260);
        return;
      }

      try {
        const payload = {
          message,
          history: this.history.slice(-8),
          context: this.buildContext()
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const warning = data.error || "The assistant is unavailable right now.";
          assistantPlaceholder.classList.add("chat-message-warning");
          assistantPlaceholder.querySelector("p").textContent = warning;
          this.setBusyState(false, data.retryAfterSec
            ? "Cooling down for " + data.retryAfterSec + "s to prevent spam."
            : "Request blocked or unavailable.");
          return;
        }

        const reply = data.reply || "I couldn't generate a response.";
        assistantPlaceholder.querySelector("p").textContent = reply;
        this.history.push(
          { role: "user", content: message },
          { role: "assistant", content: reply }
        );
        this.history = this.history.slice(-12);
        this.setBusyState(false, data.remaining !== undefined
          ? "Guard active. " + data.remaining + " requests left in the current window."
          : "Short replies only. Cooldown enabled.");
      } catch (error) {
        assistantPlaceholder.classList.add("chat-message-warning");
        assistantPlaceholder.querySelector("p").textContent =
          "Network issue. If you just deployed, add the Gemini key in Vercel first.";
        this.setBusyState(false, "Unable to reach the chat endpoint.");
      } finally {
        this.pending = false;
      }
    }

    buildContext() {
      const dashboard = window.AdaptiveStudyDashboard || {};
      const currentCard = dashboard.content?.getCurrentCard?.() || null;
      const loadState = dashboard.engine?.getLoadState?.() || null;

      return {
        currentSubject: currentCard?.subject || null,
        currentQuestion: currentCard?.question || null,
        currentAnswer: currentCard?.answer || null,
        loadState
      };
    }

    generateLocalReply(message) {
      const context = this.buildContext();
      const prompt = message.toLowerCase();
      const subject = context.currentSubject || "your current subject";
      const question = context.currentQuestion || "the current flashcard";
      const answer = context.currentAnswer || "No answer is loaded yet.";

      if (/(answer|solution|what is it|explain this card|current card)/.test(prompt)) {
        return "For " + subject + ", the current card asks: " + question + " Answer: " + answer;
      }

      if (/(summary|summarise|summarize|short note|quick note)/.test(prompt)) {
        return "Quick summary for " + subject + ": " + answer + " Focus on the key idea first, then connect it back to the question: " + question;
      }

      if (/(mnemonic|memory trick|remember)/.test(prompt)) {
        return "Memory trick: turn the key terms in this answer into a tiny phrase you can repeat aloud. For this card, try anchoring these words: " + this.extractKeywords(answer).join(", ") + ".";
      }

      if (/(quiz me|test me|ask me)/.test(prompt)) {
        return "Try this recall prompt without looking: " + question + " When you're ready, say 'check answer' and compare with: " + answer;
      }

      if (/(confused|don't understand|dont understand|explain|help)/.test(prompt)) {
        return "Here is the simple version for " + subject + ": " + answer + " If you want, ask me for a mnemonic, a one-line summary, or a practice question on this same topic.";
      }

      if (/(newton|force|acceleration)/.test(prompt)) {
        return "Newton's Second Law says F = ma. That means force equals mass times acceleration, so bigger mass or bigger acceleration means more force is needed.";
      }

      return "I can help locally with the current card. Ask for a summary, explanation, mnemonic, or practice prompt for " + subject + ". Current card: " + question;
    }

    extractKeywords(answer) {
      return String(answer)
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 4);
    }

    appendMessage(role, text) {
      const wrapper = document.createElement("div");
      const roleLabel = document.createElement("span");
      const body = document.createElement("p");

      wrapper.className = "chat-message chat-message-" + role;
      roleLabel.className = "chat-message-role";
      roleLabel.textContent = role === "user" ? "You" : "Assistant";
      body.textContent = text;

      wrapper.append(roleLabel, body);
      this.messages?.appendChild(wrapper);
      this.messages.scrollTop = this.messages.scrollHeight;
      return wrapper;
    }

    setBusyState(isBusy, message) {
      if (this.sendButton) {
        this.sendButton.disabled = isBusy;
        this.sendButton.textContent = isBusy ? "Sending..." : "Send";
      }

      if (this.input) {
        this.input.disabled = isBusy;
      }

      if (this.status) {
        this.status.textContent = message;
      }
    }
  }

  window.AdaptiveStudyChatbot = AdaptiveStudyChatbot;
})();
