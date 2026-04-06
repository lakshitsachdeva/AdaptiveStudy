(function () {
  "use strict";

  const FLASHCARD_DECK = [
    { id: "bio-1", subject: "Biology", question: "What is the powerhouse of the cell?", answer: "Mitochondria — produces ATP via cellular respiration.", difficulty: "easy" },
    { id: "bio-2", subject: "Biology", question: "Which organelle contains chlorophyll for photosynthesis?", answer: "Chloroplasts — they capture light energy to make glucose.", difficulty: "easy" },
    { id: "bio-3", subject: "Biology", question: "What is the main difference between mitosis and meiosis?", answer: "Mitosis makes two identical diploid cells; meiosis makes four genetically varied haploid cells.", difficulty: "medium" },
    { id: "bio-4", subject: "Biology", question: "What is transcription in gene expression?", answer: "Transcription is the process of copying a DNA sequence into messenger RNA.", difficulty: "hard" },
    { id: "phy-1", subject: "Physics", question: "State Newton's Second Law.", answer: "F = ma — Force equals mass times acceleration.", difficulty: "easy" },
    { id: "phy-2", subject: "Physics", question: "What is the speed of light in a vacuum?", answer: "Approximately 3.0 × 10^8 meters per second.", difficulty: "easy" },
    { id: "phy-3", subject: "Physics", question: "What does the law of conservation of energy state?", answer: "Energy cannot be created or destroyed; it can only change form or transfer between systems.", difficulty: "medium" },
    { id: "phy-4", subject: "Physics", question: "What is the equation for gravitational potential energy near Earth's surface?", answer: "U = mgh — mass times gravitational field strength times height.", difficulty: "hard" },
    { id: "his-1", subject: "History", question: "When did World War II end?", answer: "1945 — VE Day was May 8, and VJ Day was September 2.", difficulty: "easy" },
    { id: "his-2", subject: "History", question: "What was the Magna Carta?", answer: "A 1215 charter that limited the English king's power and affirmed certain legal rights.", difficulty: "medium" },
    { id: "his-3", subject: "History", question: "What event sparked the start of World War I?", answer: "The assassination of Archduke Franz Ferdinand in Sarajevo in 1914.", difficulty: "medium" },
    { id: "his-4", subject: "History", question: "Why was the fall of the Berlin Wall historically significant?", answer: "It symbolized the collapse of Soviet influence in Eastern Europe and the approaching end of the Cold War.", difficulty: "hard" },
    { id: "math-1", subject: "Math", question: "What is the derivative of sin(x)?", answer: "cos(x).", difficulty: "easy" },
    { id: "math-2", subject: "Math", question: "State the Pythagorean theorem.", answer: "In a right triangle, a^2 + b^2 = c^2.", difficulty: "easy" },
    { id: "math-3", subject: "Math", question: "What is the quadratic formula?", answer: "x = (-b ± sqrt(b^2 - 4ac)) / (2a).", difficulty: "medium" },
    { id: "math-4", subject: "Math", question: "What is the indefinite integral of 1/x?", answer: "ln|x| + C.", difficulty: "hard" },
    { id: "lit-1", subject: "Literature", question: "Who wrote 'Pride and Prejudice'?", answer: "Jane Austen, published in 1813.", difficulty: "easy" },
    { id: "lit-2", subject: "Literature", question: "What is an iambic pentameter?", answer: "A poetic meter with five iambs per line, often sounding like da-DUM repeated five times.", difficulty: "medium" },
    { id: "lit-3", subject: "Literature", question: "Who narrates 'The Great Gatsby'?", answer: "Nick Carraway.", difficulty: "medium" },
    { id: "lit-4", subject: "Literature", question: "What central theme drives Shakespeare's 'Macbeth'?", answer: "Unchecked ambition and the moral collapse it unleashes.", difficulty: "hard" }
  ];

  const SUBJECTS = ["Biology", "Physics", "History", "Math", "Literature"];
  const RING_CIRCUMFERENCE = 2 * Math.PI * 18;
  const TRANSITION_MS = 200;
  const STORAGE_KEY = "adaptivestudy-study-state";

  class StudyContent {
    constructor() {
      this.currentIndex = 0;
      this.fullDeck = this.shuffle(FLASHCARD_DECK.slice());
      this.deck = this.fullDeck.slice();
      this.isFlipped = false;
      this.learnedIds = new Set();
      this.reviewIds = new Set();
      this.currentLoadState = "low";
      this.subjectFilter = null;
      this.filterMode = "all";
      this.confidenceHistory = {};
      this.reviewMeta = {};
      this.cardStats = {};
      this.animationTimeouts = [];

      this.flashcard = document.getElementById("flashcard");
      this.flashcardInner = document.getElementById("flashcard-inner");
      this.flashcardFront = document.getElementById("flashcard-front");
      this.flashcardBack = document.getElementById("flashcard-back");
      this.questionText = document.getElementById("flashcard-question-text");
      this.answerText = document.getElementById("flashcard-answer-text");
      this.subjectBadge = document.getElementById("card-subject");
      this.difficultyBadge = document.getElementById("card-difficulty");
      this.counterLabel = document.getElementById("card-counter");
      this.confidenceRow = document.getElementById("confidence-row");
      this.topicButtons = Array.from(document.querySelectorAll(".topic-pill-button"));
      this.progressElements = this.buildProgressMap();

      for (const card of FLASHCARD_DECK) {
        this.reviewMeta[card.id] = {
          nextReviewScore: 0,
          interval: 1,
          easeFactor: 2.5
        };
        this.cardStats[card.id] = {
          seen: 0,
          flipped: 0,
          learned: false,
          reviewFlagged: false,
          avgConfidence: null,
          lastSeen: null
        };
      }

      this.loadPersistedState();
      this.renderCard();
      this.updateProgress();
    }

    getCurrentCard() {
      return this.deck[this.currentIndex] || null;
    }

    renderCard() {
      const card = this.getCurrentCard();
      this.resetFlipState();

      if (!card) {
        if (this.subjectBadge) this.subjectBadge.textContent = "No Cards";
        if (this.difficultyBadge) {
          this.difficultyBadge.textContent = "Filtered";
          this.difficultyBadge.className = "card-difficulty";
        }
        if (this.questionText) this.questionText.textContent = "No flashcards are available for the current filter.";
        if (this.answerText) this.answerText.textContent = "Try switching subjects, reducing load, or leaving Due mode.";
        if (this.counterLabel) this.counterLabel.textContent = "Card 0 of 0";
        this.syncTopicPills(null);
        return;
      }

      if (this.questionText) this.questionText.textContent = card.question;
      if (this.answerText) this.answerText.textContent = card.answer;
      if (this.subjectBadge) this.subjectBadge.textContent = card.subject;
      if (this.counterLabel) this.counterLabel.textContent = "Card " + (this.currentIndex + 1) + " of " + this.deck.length;

      if (this.difficultyBadge) {
        this.difficultyBadge.textContent = this.capitalize(card.difficulty);
        this.difficultyBadge.className = "card-difficulty " + card.difficulty;
      }

      if (this.flashcardFront) this.flashcardFront.dataset.subject = card.subject;
      if (this.flashcardBack) this.flashcardBack.dataset.subject = card.subject;
      if (this.confidenceRow) this.confidenceRow.hidden = true;

      this.trackCardSeen(card);
      this.syncTopicPills(card);
      this.dispatch("card-rendered", { card, index: this.currentIndex, deckSize: this.deck.length });
    }

    nextCard() {
      if (!this.deck.length) {
        this.renderCard();
        return;
      }

      this.transitionCard(() => {
        this.currentIndex = (this.currentIndex + 1) % this.deck.length;
        this.renderCard();
      });
    }

    prevCard() {
      if (!this.deck.length) {
        return;
      }

      this.transitionCard(() => {
        this.currentIndex = (this.currentIndex - 1 + this.deck.length) % this.deck.length;
        this.renderCard();
      });
    }

    flipCard() {
      if (!this.flashcard || !this.flashcardInner) {
        return;
      }

      const card = this.getCurrentCard();

      this.isFlipped = !this.isFlipped;
      this.flashcard.classList.toggle("is-flipped", this.isFlipped);
      this.flashcardInner.dataset.flashcardState = this.isFlipped ? "back" : "front";

      if (this.confidenceRow) {
        this.confidenceRow.hidden = !this.isFlipped;
      }

      if (card) {
        this.cardStats[card.id].flipped += 1;
        this.dispatch("card-flipped", { card, flipped: this.isFlipped });
      }
    }

    markLearned() {
      const card = this.getCurrentCard();

      if (!card) {
        return;
      }

      this.learnedIds.add(card.id);
      this.reviewIds.delete(card.id);
      this.cardStats[card.id].learned = true;
      this.updateProgress();
      this.saveState();
      this.dispatch("card-learned", { card });
      this.nextCard();
    }

    markReview() {
      const card = this.getCurrentCard();

      if (!card) {
        return;
      }

      this.reviewIds.add(card.id);
      this.cardStats[card.id].reviewFlagged = true;
      this.updateProgress();
      this.saveState();
      this.dispatch("card-review", { card });
      this.nextCard();
    }

    recordConfidence(cardId, rating) {
      if (!this.reviewMeta[cardId]) {
        return;
      }

      const safeRating = this.clamp(Math.round(Number(rating) || 0), 1, 3);
      const history = this.confidenceHistory[cardId] || [];
      history.push(safeRating);
      this.confidenceHistory[cardId] = history;

      const meta = this.reviewMeta[cardId];

      if (safeRating === 1) {
        meta.interval = 1;
        meta.easeFactor = Math.max(1.3, meta.easeFactor - 0.2);
      } else if (safeRating === 3) {
        meta.interval = Math.max(1, Math.round(meta.interval * meta.easeFactor));
        meta.easeFactor += 0.1;
      }

      meta.nextReviewScore = Date.now() + meta.interval * 24 * 60 * 60 * 1000;

      const recent = history.slice(-3);
      const avg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
      this.cardStats[cardId].avgConfidence = avg;
      this.updateProgress();
      this.saveState();

      this.dispatch("confidence-recorded", { cardId, rating: safeRating, avgConfidence: avg });
    }

    getNextReviewOrder() {
      return this.deck
        .slice()
        .sort((a, b) => (this.reviewMeta[a.id]?.nextReviewScore || 0) - (this.reviewMeta[b.id]?.nextReviewScore || 0));
    }

    getCardAnalytics(cardId) {
      return this.cardStats[cardId] ? Object.assign({}, this.cardStats[cardId]) : null;
    }

    getAllCardStats() {
      return JSON.parse(JSON.stringify(this.cardStats));
    }

    getSubjectProgress() {
      const progress = {};

      for (const subject of SUBJECTS) {
        const subjectCards = FLASHCARD_DECK.filter((card) => card.subject === subject);
        const completedCount = subjectCards.filter((card) => this.isCardCompleted(card.id)).length;
        progress[subject] = subjectCards.length ? completedCount / subjectCards.length : 0;
      }

      return progress;
    }

    getSubjectMastery() {
      const mastery = {};

      for (const subject of SUBJECTS) {
        const cards = FLASHCARD_DECK.filter((card) => card.subject === subject);
        const scores = cards
          .map((card) => this.cardStats[card.id].avgConfidence)
          .filter((value) => typeof value === "number");
        const avgConfidence = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
        const pct = this.clamp(avgConfidence / 3, 0, 1);
        let level = "Beginner";

        if (pct >= 0.8) {
          level = "Mastered";
        } else if (pct >= 0.5) {
          level = "Proficient";
        } else if (pct >= 0.25) {
          level = "Developing";
        }

        mastery[subject] = {
          level,
          pct
        };
      }

      return mastery;
    }

    getStruggleCards() {
      return this.fullDeck.filter((card) => {
        const avg = this.cardStats[card.id].avgConfidence;
        return typeof avg === "number" && avg < 1.5;
      });
    }

    getSessionSummary() {
      const stats = Object.values(this.cardStats);
      const totalSeen = stats.reduce((sum, card) => sum + card.seen, 0);
      const totalLearned = stats.filter((card) => card.learned).length;
      const totalReview = stats.filter((card) => card.reviewFlagged).length;
      const masteredThisSession = Object.values(this.getSubjectMastery()).filter((entry) => entry.level === "Mastered").length;
      const struggleCards = this.getStruggleCards().slice(0, 3);
      const subjectMastery = this.getSubjectMastery();
      const confidenceValues = Object.values(this.cardStats).map((entry) => entry.avgConfidence).filter((value) => typeof value === "number");
      const avgConfidence = confidenceValues.length
        ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
        : null;
      const ranked = Object.entries(subjectMastery).sort((a, b) => b[1].pct - a[1].pct);

      return {
        totalSeen,
        totalLearned,
        totalReview,
        masteredThisSession,
        struggleCards,
        subjectMastery,
        avgConfidence,
        topSubject: ranked[0] ? ranked[0][0] : null,
        weakSubject: ranked[ranked.length - 1] ? ranked[ranked.length - 1][0] : null
      };
    }

    updateProgress() {
      const progress = this.getSubjectProgress();

      for (const subject of SUBJECTS) {
        const ratio = progress[subject] || 0;
        const percentage = Math.round(ratio * 100);
        const entry = this.progressElements[subject];
        const subjectCards = FLASHCARD_DECK.filter((card) => card.subject === subject);
        const completedCount = subjectCards.filter((card) => this.isCardCompleted(card.id)).length;

        if (!entry || !entry.fill) {
          continue;
        }

        entry.fill.style.strokeDasharray = String(RING_CIRCUMFERENCE);
        entry.fill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - ratio));
        entry.fill.style.stroke = this.getProgressColor(percentage);

        if (entry.label) {
          entry.label.textContent = subject;
        }

        if (entry.button) {
          entry.button.setAttribute("aria-label", subject + " progress " + percentage + " percent");
          entry.button.dataset.progress = percentage + "%";
          entry.button.dataset.detail = completedCount + "/" + subjectCards.length + " cards";
          entry.button.classList.toggle("complete", percentage === 100);
        }
      }
    }

    adaptToLoad(state) {
      const safeState = this.normalizeState(state);

      if (safeState === this.currentLoadState) {
        return;
      }

      this.currentLoadState = safeState;
      this.applyFilters();
    }

    filterBySubject(subject) {
      const nextFilter = SUBJECTS.includes(subject) ? subject : null;
      this.subjectFilter = nextFilter;
      this.applyFilters();
    }

    setFilterMode(mode) {
      this.filterMode = mode || "all";
      this.applyFilters();
    }

    buildProgressMap() {
      return {
        Biology: this.buildProgressEntry("biology"),
        Physics: this.buildProgressEntry("physics"),
        History: this.buildProgressEntry("history"),
        Math: this.buildProgressEntry("math"),
        Literature: this.buildProgressEntry("literature")
      };
    }

    buildProgressEntry(slug) {
      const ring = document.getElementById("progress-ring-" + slug);

      return {
        ring,
        fill: ring ? ring.querySelector(".mini-progress-ring-fill") : null,
        label: document.getElementById("progress-label-" + slug),
        button: document.getElementById("progress-ring-button-" + slug)
      };
    }

    trackCardSeen(card) {
      const stats = this.cardStats[card.id];
      stats.seen += 1;
      stats.lastSeen = Date.now();
    }

    transitionCard(onSwap) {
      if (!this.flashcard) {
        onSwap();
        return;
      }

      this.clearAnimationTimeouts();
      this.flashcard.classList.remove("card-entering", "card-entering-active");
      this.flashcard.classList.add("card-exiting");

      const outTimer = window.setTimeout(() => {
        onSwap();
        this.flashcard.classList.remove("card-exiting");
        this.flashcard.classList.add("card-entering");

        const inTimer = window.setTimeout(() => {
          this.flashcard.classList.add("card-entering-active");

          const cleanupTimer = window.setTimeout(() => {
            this.flashcard.classList.remove("card-entering", "card-entering-active");
          }, TRANSITION_MS);

          this.animationTimeouts.push(cleanupTimer);
        }, 16);

        this.animationTimeouts.push(inTimer);
      }, TRANSITION_MS);

      this.animationTimeouts.push(outTimer);
    }

    resetFlipState() {
      this.isFlipped = false;

      if (this.flashcard) {
        this.flashcard.classList.remove("is-flipped");
      }

      if (this.flashcardInner) {
        this.flashcardInner.dataset.flashcardState = "front";
      }

      if (this.confidenceRow) {
        this.confidenceRow.hidden = true;
      }
    }

    clearAnimationTimeouts() {
      for (const id of this.animationTimeouts) {
        window.clearTimeout(id);
      }

      this.animationTimeouts = [];
    }

    syncTopicPills(card) {
      const activeSubject = this.subjectFilter || "All";

      for (const button of this.topicButtons) {
        const buttonTopic = button.dataset.topic || "";
        const active = buttonTopic === activeSubject;
        button.classList.toggle("active", active);
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      }

      for (const subject of SUBJECTS) {
        const progressButton = this.progressElements[subject]?.button;
        if (!progressButton) {
          continue;
        }

        const selected = Boolean(this.subjectFilter && subject === this.subjectFilter);
        progressButton.classList.toggle("is-selected", selected);
        progressButton.setAttribute("aria-pressed", selected ? "true" : "false");
      }
    }

    getAllowedDifficulties() {
      if (this.currentLoadState === "high") {
        return new Set(["easy"]);
      }

      if (this.currentLoadState === "medium") {
        return new Set(["easy", "medium"]);
      }

      return new Set(["easy", "medium", "hard"]);
    }

    applyFilters() {
      const currentCard = this.getCurrentCard();
      const allowed = this.getAllowedDifficulties();
      const struggleIds = new Set(this.getStruggleCards().map((card) => card.id));
      let nextDeck = this.fullDeck.filter((card) => {
        const subjectPass = !this.subjectFilter || card.subject === this.subjectFilter;
        const difficultyPass = allowed.has(card.difficulty);
        let reviewPass = true;

        if (this.filterMode === "due") {
          reviewPass = (this.reviewMeta[card.id]?.nextReviewScore || 0) <= Date.now();
        }

        return subjectPass && difficultyPass && reviewPass;
      });

      if (this.currentLoadState === "high") {
        const easyStruggles = nextDeck.filter((card) => card.difficulty === "easy" && struggleIds.has(card.id));
        if (easyStruggles.length) {
          nextDeck = easyStruggles.concat(nextDeck.filter((card) => !easyStruggles.some((entry) => entry.id === card.id)));
        }
      }

      nextDeck = nextDeck.slice().sort((a, b) => {
        const aDue = this.reviewMeta[a.id]?.nextReviewScore || 0;
        const bDue = this.reviewMeta[b.id]?.nextReviewScore || 0;
        return aDue - bDue;
      });

      this.deck = nextDeck;

      if (!this.deck.length) {
        this.currentIndex = 0;
        this.renderCard();
        return;
      }

      const preserved = currentCard ? this.deck.findIndex((card) => card.id === currentCard.id) : -1;
      this.currentIndex = preserved >= 0 ? preserved : 0;
      this.renderCard();
    }

    shuffle(cards) {
      for (let index = cards.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const temp = cards[index];
        cards[index] = cards[swapIndex];
        cards[swapIndex] = temp;
      }

      return cards;
    }

    capitalize(value) {
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
    }

    getProgressColor(percentage) {
      if (percentage > 70) {
        return "var(--accent-green)";
      }

      if (percentage >= 40) {
        return "var(--accent-amber)";
      }

      return "var(--accent-coral)";
    }

    normalizeState(state) {
      return state === "high" || state === "medium" || state === "low" ? state : "low";
    }

    dispatch(type, detail) {
      if (typeof window !== "undefined" && typeof window.CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("adaptivestudy:" + type, { detail }));
      }
    }

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    isCardCompleted(cardId) {
      const stats = this.cardStats[cardId];

      return Boolean(
        this.learnedIds.has(cardId) ||
        this.reviewIds.has(cardId) ||
        stats?.learned ||
        stats?.reviewFlagged ||
        typeof stats?.avgConfidence === "number"
      );
    }

    saveState() {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            learnedIds: Array.from(this.learnedIds),
            reviewIds: Array.from(this.reviewIds),
            confidenceHistory: this.confidenceHistory,
            reviewMeta: this.reviewMeta,
            cardStats: this.cardStats
          })
        );
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to persist study state:", error);
      }
    }

    loadPersistedState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed.learnedIds)) {
          this.learnedIds = new Set(parsed.learnedIds);
        }

        if (Array.isArray(parsed.reviewIds)) {
          this.reviewIds = new Set(parsed.reviewIds);
        }

        if (parsed.confidenceHistory && typeof parsed.confidenceHistory === "object") {
          this.confidenceHistory = parsed.confidenceHistory;
        }

        if (parsed.reviewMeta && typeof parsed.reviewMeta === "object") {
          this.reviewMeta = Object.assign(this.reviewMeta, parsed.reviewMeta);
        }

        if (parsed.cardStats && typeof parsed.cardStats === "object") {
          this.cardStats = Object.assign(this.cardStats, parsed.cardStats);
        }
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to restore study state:", error);
      }
    }

    clearPersistedState() {
      this.learnedIds = new Set();
      this.reviewIds = new Set();
      this.confidenceHistory = {};
      this.subjectFilter = null;
      this.filterMode = "all";

      for (const card of FLASHCARD_DECK) {
        this.reviewMeta[card.id] = {
          nextReviewScore: 0,
          interval: 1,
          easeFactor: 2.5
        };
        this.cardStats[card.id] = {
          seen: 0,
          flipped: 0,
          learned: false,
          reviewFlagged: false,
          avgConfidence: null,
          lastSeen: null
        };
      }

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("[AdaptiveStudy] Unable to clear study state:", error);
      }

      this.applyFilters();
      this.updateProgress();
    }
  }

  window.FLASHCARD_DECK = FLASHCARD_DECK.slice();
  window.StudyContent = new StudyContent();
})();
