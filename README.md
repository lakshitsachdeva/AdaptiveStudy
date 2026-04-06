# AdaptiveStudy
### A Cognitive Load-Aware Study Dashboard

> "An interface that responds to how you feel, not just what you do."

A static web prototype built for the Human-Computer Interaction course (`702CO0E007`) demonstrating real-time cognitive load estimation and adaptive interface design.

---

## ✦ What It Does

AdaptiveStudy is a study dashboard that watches how a learner interacts with the interface and estimates their current mental load in real time. Instead of relying on a quiz score alone, it fuses behavioral signals like cursor movement, hesitation, correction bursts, and scrolling patterns into a single live Mental Load Score from `0–100`.

That score drives interface adaptation. When the learner appears comfortable, the full interface remains visible and more difficult flashcards can be shown. When overload is detected, the interface shifts into Calm Mode, simplifying the layout, reducing visual density, and filtering harder content out of the active study flow.

The result is a front-end HCI prototype that explores how a study interface can become responsive to cognitive state, not just explicit user commands.

---

## ✦ Live Demo

No build step and no external dependencies beyond browser APIs.

- Open [index.html](/Users/lakshitsachdeva/Desktop/Projects/hci-proj/index.html) directly in a modern browser
- Or run:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

---

## ✦ Key Features

- 🧠 4 behavioral sensors fused into a live Mental Load Score
- 🌿 Calm Mode / Focus Mode adaptive transitions
- 📚 20 flashcards across 5 subjects with difficulty adaptation
- 📊 Live cognitive metrics panel with sparkline history
- ⏱ Session timer with Pomodoro break suggestion
- 📋 One-click session report export
- ⌨ Full keyboard shortcut support
- 🔬 Research overlay (`Ctrl+R`) with live session stats
- 🎭 Demo Mode for controlled presentations
- 💾 Notes auto-saved to `localStorage`

---

## ✦ Cognitive Load Detection

| Sensor | Weight | What It Measures | Why It Matters |
|---|---:|---|---|
| Cursor Entropy | 25% | Angular deviation and jitter in recent mouse motion | Erratic movement can indicate uncertainty or stress |
| Hesitation Index | 35% | Gaps between keystrokes/clicks plus hover pauses | Long pauses are a strong signal of rising friction |
| Error Rate | 25% | Backspace/Delete bursts and correction behavior | Repeated corrections can suggest confusion |
| Scroll Rhythm | 15% | Scroll speed and direction reversals | Bursty, reversal-heavy scrolling can indicate disorientation |

The final score is smoothed with an exponential moving average so the UI changes feel stable rather than twitchy.

---

## ✦ Interface States

| Mode | When It Appears | What Changes |
|---|---|---|
| Focus Mode | Low or medium load | Full three-panel layout, richer information density, all supported content visible |
| Calm Mode | Sustained high load | Side panels collapse, main card gains breathing emphasis, harder cards are filtered out, interface complexity reduces |

---

## ✦ HCI Principles Applied

- Cognitive Load Theory
- Miller's Law
- Fitts' Law
- Progressive Disclosure
- Aesthetic-Usability Effect
- Nielsen's Heuristic #1: Visibility of System Status

---

## ✦ Technology Stack

Zero dependencies. Pure HTML, CSS, and vanilla JavaScript.

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 |
| Logic | Vanilla JS ES6+ |
| Graphics | SVG |
| Persistence | localStorage API |

---

## ✦ Project Structure

```text
AdaptiveStudy/
├── index.html                      # Semantic app shell, overlays, and UI structure
├── style.css                       # Full visual system, animations, overlays, responsive styles
├── README.md                       # Repository documentation
├── FINAL_SUBMISSION_PLAN.md        # Submission planning document
└── js/
    ├── cognitive-engine.js         # Sensor fusion, calibration, confidence, load scoring
    ├── study-content.js            # Flashcards, mastery, progress, spaced repetition logic
    ├── ui-adapter.js               # Live UI adaptation, gauge, bars, toasts, overlays
    ├── analytics.js                # Session analytics and exportable report generation
    ├── onboarding.js               # First-run guided interface tour
    └── dashboard.js                # Main orchestration and event wiring
```

---

## ✦ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Flip flashcard |
| `→` | Next card |
| `L` | Mark as learned |
| `R` | Flag for review |
| `D` | Toggle Demo Mode |
| `?` | Open keyboard shortcut guide |
| `Ctrl + R` | Toggle Research Overlay |
| `Esc` | Close overlays |

---

## ✦ Color Palette

| Token | Hex | Role |
|---|---|---|
| `--bg-primary` | `#FAF8F3` | Warm ivory background |
| `--bg-secondary` | `#F2EFE7` | Parchment secondary surface |
| `--bg-card` | `#FFFFFF` | Cards and overlays |
| `--bg-sidebar` | `#F5F3EC` | Sidebar and panel surface |
| `--text-primary` | `#2C2C2C` | Main text |
| `--text-secondary` | `#7A7670` | Supporting text |
| `--text-muted` | `#B0ADA6` | Low-emphasis labels |
| `--accent-green` | `#6BAF7A` | Calm / low load |
| `--accent-amber` | `#E09A4F` | Medium load |
| `--accent-coral` | `#D96B6B` | High load / overload |
| `--accent-blue` | `#6A9BB5` | Interaction and navigation |
| `--border` | `#E8E4DC` | Borders and dividers |

Typography:

- Headings: `Playfair Display`
- Body: `DM Sans`

---

## ✦ Academic Context

Built as an HCI course prototype exploring Sweller's Cognitive Load Theory applied to adaptive interface design. Results are heuristic and suitable for demonstration purposes rather than clinical measurement.

---

## ✦ References

1. J. Sweller, "Cognitive load during problem solving," *Cognitive Science*, vol. 12, no. 2, pp. 257-285, 1988.
2. F. Paas, A. Renkl, and J. Sweller, "Cognitive load theory and instructional design: Recent developments," *Educational Psychologist*, vol. 38, no. 1, pp. 1-4, 2003.
3. S. G. Hart and L. E. Staveland, "Development of NASA-TLX," in *Human Mental Workload*, Amsterdam, Netherlands: North-Holland, 1988, pp. 139-183.
4. G. A. Miller, "The magical number seven, plus or minus two," *Psychological Review*, vol. 63, no. 2, pp. 81-97, 1956.
5. T. Yamauchi et al., "Reading emotion from mouse cursor motions," *Cognitive Science*, vol. 41, no. 3, pp. 771-806, 2017.

---

## ✦ Notes

- This repository is intentionally dependency-free for easy demonstration.
- Demo Mode provides a scripted 20-second narrative for academic presentations.
- The research overlay and exported report are designed to support final submission documentation and viva/demo use.
