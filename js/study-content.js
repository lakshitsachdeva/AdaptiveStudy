(function () {
  "use strict";

  const FLASHCARD_DECK = [
    {
      id: "bio-1",
      subject: "Biology",
      question: "What is the powerhouse of the cell?",
      answer: "Mitochondria — produces ATP via cellular respiration.",
      difficulty: "easy"
    },
    {
      id: "bio-2",
      subject: "Biology",
      question: "Which organelle contains chlorophyll for photosynthesis?",
      answer: "Chloroplasts — they capture light energy to make glucose.",
      difficulty: "easy"
    },
    {
      id: "bio-3",
      subject: "Biology",
      question: "What is the main difference between mitosis and meiosis?",
      answer: "Mitosis makes two identical diploid cells; meiosis makes four genetically varied haploid cells.",
      difficulty: "medium"
    },
    {
      id: "bio-4",
      subject: "Biology",
      question: "What is transcription in gene expression?",
      answer: "Transcription is the process of copying a DNA sequence into messenger RNA.",
      difficulty: "hard"
    },
    {
      id: "phy-1",
      subject: "Physics",
      question: "State Newton's Second Law.",
      answer: "F = ma — Force equals mass times acceleration.",
      difficulty: "easy"
    },
    {
      id: "phy-2",
      subject: "Physics",
      question: "What is the speed of light in a vacuum?",
      answer: "Approximately 3.0 × 10^8 meters per second.",
      difficulty: "easy"
    },
    {
      id: "phy-3",
      subject: "Physics",
      question: "What does the law of conservation of energy state?",
      answer: "Energy cannot be created or destroyed; it can only change form or transfer between systems.",
      difficulty: "medium"
    },
    {
      id: "phy-4",
      subject: "Physics",
      question: "What is the equation for gravitational potential energy near Earth's surface?",
      answer: "U = mgh — mass times gravitational field strength times height.",
      difficulty: "hard"
    },
    {
      id: "his-1",
      subject: "History",
      question: "When did World War II end?",
      answer: "1945 — VE Day was May 8, and VJ Day was September 2.",
      difficulty: "easy"
    },
    {
      id: "his-2",
      subject: "History",
      question: "What was the Magna Carta?",
      answer: "A 1215 charter that limited the English king's power and affirmed certain legal rights.",
      difficulty: "medium"
    },
    {
      id: "his-3",
      subject: "History",
      question: "What event sparked the start of World War I?",
      answer: "The assassination of Archduke Franz Ferdinand in Sarajevo in 1914.",
      difficulty: "medium"
    },
    {
      id: "his-4",
      subject: "History",
      question: "Why was the fall of the Berlin Wall historically significant?",
      answer: "It symbolized the collapse of Soviet influence in Eastern Europe and the approaching end of the Cold War.",
      difficulty: "hard"
    },
    {
      id: "math-1",
      subject: "Math",
      question: "What is the derivative of sin(x)?",
      answer: "cos(x).",
      difficulty: "easy"
    },
    {
      id: "math-2",
      subject: "Math",
      question: "State the Pythagorean theorem.",
      answer: "In a right triangle, a^2 + b^2 = c^2.",
      difficulty: "easy"
    },
    {
      id: "math-3",
      subject: "Math",
      question: "What is the quadratic formula?",
      answer: "x = (-b ± sqrt(b^2 - 4ac)) / (2a).",
      difficulty: "medium"
    },
    {
      id: "math-4",
      subject: "Math",
      question: "What is the indefinite integral of 1/x?",
      answer: "ln|x| + C.",
      difficulty: "hard"
    },
    {
      id: "lit-1",
      subject: "Literature",
      question: "Who wrote 'Pride and Prejudice'?",
      answer: "Jane Austen, published in 1813.",
      difficulty: "easy"
    },
    {
      id: "lit-2",
      subject: "Literature",
      question: "What is an iambic pentameter?",
      answer: "A poetic meter with five iambs per line, often sounding like da-DUM repeated five times.",
      difficulty: "medium"
    },
    {
      id: "lit-3",
      subject: "Literature",
      question: "Who narrates 'The Great Gatsby'?",
      answer: "Nick Carraway.",
      difficulty: "medium"
    },
    {
      id: "lit-4",
      subject: "Literature",
      question: "What central theme drives Shakespeare's 'Macbeth'?",
      answer: "Unchecked ambition and the moral collapse it unleashes.",
      difficulty: "hard"
    }
  ];

  const SUBJECTS = ["Biology", "Physics", "History", "Math", "Literature"];
  const RING_CIRCUMFERENCE = 2 * Math.PI * 18;
  const SLIDE_OUT_MS = 200;
  const SLIDE_IN_MS = 240;

  class StudyContent {
    constructor() {
      this.currentIndex = 0;
      this.fullDeck = this.shuffleDeck(FLASHCARD_DECK.slice());
      this.deck = this.fullDeck.slice();
      this.isFlipped = false;
      this.learnedIds = new Set();
      this.reviewIds = new Set();
      this.currentLoadState = "low";
      this.subjectFilter = null;
      this.isAnimating = false;
      this.animationTimeoutIds = [];

      this.flashcard = document.getElementById("flashcard");
      this.flashcardInner = document.getElementById("flashcard-inner");
      this.flashcardFront = document.getElementById("flashcard-front");
      this.flashcardBack = document.getElementById("flashcard-back");
      this.subjectBadge = document.getElementById("flashcard-question-label");
      this.questionText = document.getElementById("flashcard-question-text");
      this.answerText = document.getElementById("flashcard-answer-text");
      this.topicButtons = Array.from(document.querySelectorAll(".topic-pill-button"));

      this.progressElements = this.buildProgressElementMap();

      this.renderCard();
      this.updateProgress();
      this.syncTopicPills(this.getCurrentCard());
    }

    getCurrentCard() {
      return this.deck[this.currentIndex] || null;
    }

    renderCard() {
      const card = this.getCurrentCard();

      this.resetFlipState();

      if (!card) {
        if (this.subjectBadge) {
          this.subjectBadge.textContent = "No Cards";
        }

        if (this.questionText) {
          this.questionText.textContent = "No flashcards are available for the current load filter.";
        }

        if (this.answerText) {
          this.answerText.textContent = "Try a lower load filter to restore the full deck.";
        }

        this.syncTopicPills(null);
        return;
      }

      if (this.subjectBadge) {
        this.subjectBadge.textContent = card.subject + " • " + this.capitalize(card.difficulty);
      }

      if (this.questionText) {
        this.questionText.textContent = card.question;
      }

      if (this.answerText) {
        this.answerText.textContent = card.answer;
      }

      if (this.flashcardFront) {
        this.flashcardFront.dataset.subject = card.subject;
      }

      if (this.flashcardBack) {
        this.flashcardBack.dataset.subject = card.subject;
      }

      this.syncTopicPills(card);
    }

    nextCard() {
      if (!this.deck.length) {
        this.renderCard();
        return;
      }

      if (this.isAnimating) {
        return;
      }

      if (!this.flashcard) {
        this.currentIndex = (this.currentIndex + 1) % this.deck.length;
        this.renderCard();
        return;
      }

      this.isAnimating = true;
      this.clearAnimationTimers();
      this.flashcard.classList.remove("flashcard-transition-in", "flashcard-transition-out");
      void this.flashcard.offsetWidth;
      this.flashcard.classList.add("flashcard-transition-out");

      const outTimeout = window.setTimeout(() => {
        this.currentIndex = (this.currentIndex + 1) % this.deck.length;
        this.renderCard();
        this.flashcard.classList.remove("flashcard-transition-out");
        void this.flashcard.offsetWidth;
        this.flashcard.classList.add("flashcard-transition-in");

        const inTimeout = window.setTimeout(() => {
          this.flashcard.classList.remove("flashcard-transition-in");
          this.isAnimating = false;
        }, SLIDE_IN_MS);

        this.animationTimeoutIds.push(inTimeout);
      }, SLIDE_OUT_MS);

      this.animationTimeoutIds.push(outTimeout);
    }

    flipCard() {
      if (!this.flashcard || !this.flashcardInner) {
        return;
      }

      this.isFlipped = !this.isFlipped;
      this.flashcard.classList.toggle("is-flipped", this.isFlipped);
      this.flashcardInner.dataset.flashcardState = this.isFlipped ? "back" : "front";
    }

    markLearned() {
      const currentCard = this.getCurrentCard();

      if (!currentCard) {
        return;
      }

      this.learnedIds.add(currentCard.id);
      this.reviewIds.delete(currentCard.id);
      this.nextCard();
      this.updateProgress();
    }

    markReview() {
      const currentCard = this.getCurrentCard();

      if (!currentCard) {
        return;
      }

      this.reviewIds.add(currentCard.id);
      this.nextCard();
    }

    updateProgress() {
      const subjectProgress = this.getSubjectProgress();

      for (const subject of SUBJECTS) {
        const ratio = subjectProgress[subject] || 0;
        const percentage = Math.round(ratio * 100);
        const progressEntry = this.progressElements[subject];

        if (!progressEntry || !progressEntry.ring) {
          continue;
        }

        progressEntry.ring.style.setProperty("--progress", ratio.toFixed(2));
        progressEntry.ring.style.setProperty("--progress-pct", String(percentage));
        progressEntry.ring.style.setProperty(
          "--progress-color",
          this.getProgressColor(percentage)
        );

        if (progressEntry.fill) {
          progressEntry.fill.style.strokeDasharray = String(RING_CIRCUMFERENCE);
          progressEntry.fill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - ratio));
          progressEntry.fill.style.stroke = this.getProgressColor(percentage);
        }

        if (progressEntry.label) {
          progressEntry.label.textContent = subject + " " + percentage + "%";
        }

        if (progressEntry.button) {
          progressEntry.button.setAttribute(
            "aria-label",
            subject + " progress " + percentage + " percent"
          );
        }
      }
    }

    getSubjectProgress() {
      const progress = {};

      for (const subject of SUBJECTS) {
        const subjectCards = FLASHCARD_DECK.filter((card) => card.subject === subject);
        const learnedCount = subjectCards.filter((card) => this.learnedIds.has(card.id)).length;
        progress[subject] = subjectCards.length ? learnedCount / subjectCards.length : 0;
      }

      return progress;
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
      const normalizedSubject = SUBJECTS.includes(subject) ? subject : null;

      if (normalizedSubject === this.subjectFilter) {
        return;
      }

      this.subjectFilter = normalizedSubject;
      this.applyFilters();
    }

    buildProgressElementMap() {
      return {
        Biology: this.buildProgressElementsForSubject("biology"),
        Physics: this.buildProgressElementsForSubject("physics"),
        History: this.buildProgressElementsForSubject("history"),
        Math: this.buildProgressElementsForSubject("math"),
        Literature: this.buildProgressElementsForSubject("literature")
      };
    }

    buildProgressElementsForSubject(subjectId) {
      const ring = document.getElementById("progress-ring-" + subjectId);

      return {
        ring,
        fill: ring ? ring.querySelector(".mini-progress-ring-fill") : null,
        label: document.getElementById("progress-label-" + subjectId),
        button: document.getElementById("progress-ring-button-" + subjectId)
      };
    }

    syncTopicPills(card) {
      const activeSubject = this.subjectFilter || (card ? card.subject : "");

      for (const button of this.topicButtons) {
        const matches = button.dataset.topic === activeSubject;
        button.setAttribute("aria-pressed", matches ? "true" : "false");
        button.classList.toggle("is-active", matches);
        button.classList.toggle("active", matches);
      }
    }

    resetFlipState() {
      this.isFlipped = false;

      if (this.flashcard) {
        this.flashcard.classList.remove("is-flipped");
      }

      if (this.flashcardInner) {
        this.flashcardInner.dataset.flashcardState = "front";
      }
    }

    clearAnimationTimers() {
      for (const timeoutId of this.animationTimeoutIds) {
        window.clearTimeout(timeoutId);
      }

      this.animationTimeoutIds = [];
    }

    getAllowedDifficulties(state) {
      if (state === "high") {
        return new Set(["easy"]);
      }

      if (state === "medium") {
        return new Set(["easy", "medium"]);
      }

      return new Set(["easy", "medium", "hard"]);
    }

    normalizeState(state) {
      if (state === "high" || state === "medium" || state === "low") {
        return state;
      }

      return "low";
    }

    applyFilters() {
      const currentCard = this.getCurrentCard();
      const nextDeck = this.fullDeck.filter((card) => {
        return (
          this.getAllowedDifficulties(this.currentLoadState).has(card.difficulty) &&
          (!this.subjectFilter || card.subject === this.subjectFilter)
        );
      });
      const previousDeckSignature = this.deck.map((card) => card.id).join("|");
      const nextDeckSignature = nextDeck.map((card) => card.id).join("|");

      this.deck = nextDeck;

      if (!this.deck.length) {
        this.currentIndex = 0;
        this.renderCard();
        return;
      }

      if (previousDeckSignature === nextDeckSignature && currentCard) {
        const sameCardIndex = this.deck.findIndex((card) => card.id === currentCard.id);

        if (sameCardIndex >= 0) {
          this.currentIndex = sameCardIndex;
          this.syncTopicPills(this.deck[this.currentIndex]);
          return;
        }
      }

      const preservedIndex = currentCard
        ? this.deck.findIndex((card) => card.id === currentCard.id)
        : -1;

      this.currentIndex = preservedIndex >= 0 ? preservedIndex : 0;
      this.renderCard();
    }

    shuffleDeck(cards) {
      for (let index = cards.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const temporaryCard = cards[index];
        cards[index] = cards[swapIndex];
        cards[swapIndex] = temporaryCard;
      }

      return cards;
    }

    capitalize(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
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
  }

  window.FLASHCARD_DECK = FLASHCARD_DECK.slice();
  window.StudyContent = new StudyContent();
})();
