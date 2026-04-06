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
        this.setBusyState(true, "Chat is disabled on localhost. Use the deployed app for Gemini responses.");
        this.input.placeholder = "Chat is available on the deployed Vercel version.";
        return;
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
      this.setBusyState(true, "Sending...");
      this.appendMessage("user", message);
      this.input.value = "";

      const assistantPlaceholder = this.appendMessage("assistant", "Thinking...");

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
        loadState
      };
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
