# 🧠 AdaptiveStudy — MAXIMUM MARKS UPGRADE BLUEPRINT
### Complete Codex Prompt Pack to Transform the Prototype into an Award-Worthy HCI Submission

**Project path:** `/Users/lakshitsachdeva/Desktop/Projects/hci-proj`
**Current state:** Working prototype — all core logic implemented
**Goal:** Elevate every layer — visual, functional, academic, and presentational — to the highest possible standard

---

## ⚡ WHAT THIS DOCUMENT IS

This is a sequenced set of **15 precise Codex prompts** to upgrade your existing AdaptiveStudy prototype. Each prompt targets a specific file or feature. They build on your working code — nothing gets thrown away. Everything gets dramatically better.

Read each prompt fully before running it. Prompts are **ordered by impact** — run them in sequence for best results.

---

## 🗺️ UPGRADE MAP (What Changes, What Stays)

| File | Current State | After This Blueprint |
|------|--------------|---------------------|
| `index.html` | Working shell | Semantic perfection, ARIA, Research Overlay, onboarding, keyboard shortcut map |
| `style.css` | Good foundation | Award-level polish — liquid morphs, custom cursor, animated gradient mesh, micro-interactions, print stylesheet |
| `cognitive-engine.js` | 4 sensors working | Calibration phase, confidence scoring, per-session baseline, signal quality indicators |
| `ui-adapter.js` | Functional updates | Cinematic mode transitions, animated number counters, wave effect, load state history |
| `study-content.js` | 20 cards, basic | Spaced repetition scoring, confidence ratings, per-card analytics, subject mastery levels |
| `dashboard.js` | Orchestration | Session analytics, export report, keyboard shortcut map modal, onboarding tour |
| `README.md` | Does not exist | Professional, screenshot-ready, deployable |
| `analytics.js` | Does not exist | Full session analytics engine — NEW FILE |
| `onboarding.js` | Does not exist | First-run guided tour — NEW FILE |
| `research-overlay.js` | Does not exist | Academic HCI poster overlay — NEW FILE |

---

## 📋 PRE-FLIGHT CHECKLIST

Before running any prompt, confirm this in your terminal:

```bash
cd /Users/lakshitsachdeva/Desktop/Projects/hci-proj
python3 -m http.server 8000
# Open http://localhost:8000 — app should load cleanly
```

Then open browser DevTools → Console. Zero errors = ready to upgrade.

---

---

# ═══════════════════════════════════════
# PROMPT 1 — CSS: Liquid Design System Upgrade
# ═══════════════════════════════════════

**File to edit:** `style.css`
**What this does:** Transforms the visual system from good to extraordinary. Adds animated gradient mesh, custom cursor, liquid transitions, micro-interactions, and a complete print stylesheet for the Research Overlay.

```
You are upgrading the style.css file for AdaptiveStudy — a cognitive load-aware study dashboard.
The existing CSS already implements a "Calm Minimal" design system with:
- CSS custom properties (--bg-primary: #FAF8F3, --bg-card: #FFFFFF, --accent-green: #6BAF7A, --accent-amber: #E09A4F, --accent-coral: #D96B6B, --accent-blue: #6A9BB5)
- Playfair Display headings, DM Sans body
- 3-panel layout (sidebar, main, right panel)
- Flashcard flip animation
- Calm mode transitions
- Grain overlay

ADD the following enhancements WITHOUT removing anything existing:

---

1. ANIMATED GRADIENT MESH BACKGROUND
Add to .app-shell::before (or a new .bg-mesh element):
- A slowly animating radial gradient mesh that shifts between 3 warm anchor points
- Use @keyframes meshDrift: translate and scale very slowly (60s loop)
- Colors: rgba(107,175,122,0.06), rgba(106,155,181,0.05), rgba(250,248,243,0) — subtle, never distracting
- This gives the background a living, breathing quality

2. CUSTOM CURSOR
- Create a custom cursor: a 10px circle with border 2px solid var(--accent-blue), background transparent
- On hover over interactive elements: scale to 20px, fill with accent-blue at 20% opacity
- On mousedown: scale to 8px
- Use mix-blend-mode: difference so it inverts against dark surfaces
- Implement with a div#cursor-dot that follows the mouse via JS transform (prompt 2 will wire the JS)

3. LIQUID CARD HOVER EFFECT
Upgrade .card hover:
- Not just translateY(-2px) — add a subtle perspective tilt based on mouse position within the card
- Use CSS custom properties --card-rotate-x and --card-rotate-y set by JS on mousemove
- transform: perspective(800px) rotateX(var(--card-rotate-x, 0deg)) rotateY(var(--card-rotate-y, 0deg)) translateY(-3px)
- transition: transform 0.15s ease (fast for responsiveness)
- Add a shimmer highlight that follows the mouse: a radial gradient pseudo-element that moves

4. METRIC BAR UPGRADE
The existing metric bars in the right panel (.metric-bar .bar-fill) should now:
- Have a gradient fill instead of flat color: linear-gradient(90deg, currentColor, lighter version)
- Have a subtle pulse animation when value > 70: @keyframes barPulse — opacity flickers 1 → 0.7 → 1 at 2s interval
- Have animated tick marks: 3 small vertical lines at 33%, 66%, 100% of the bar container

5. LOAD STATE BACKGROUND TINT
When body has .calm-mode:
- The --bg-primary variable transitions to a fractionally warmer tone (#F5F0E8)
- Add a full-viewport color wash overlay div.state-wash that:
  - Is transparent normally
  - In .calm-mode: background rgba(107,175,122,0.04) — barely perceptible green tint over everything
  - In .overload-mode (score > 85): background rgba(217,107,107,0.03) — barely perceptible coral tint
  - Transitions: opacity 1.5s ease

6. FLASHCARD UPGRADES
The existing flashcard flip should also have:
- A subtle particle burst on flip: 6 small dots that radiate outward from center and fade (CSS-only using pseudo-elements and animation-delay)
- A question number badge: top-left corner of card, showing "Card 3 of 8" in muted text
- A difficulty badge: top-right corner, color-coded pill (easy=green, medium=amber, hard=coral)
- Card subject: displayed as a small uppercase label above the question text

7. PROGRESS RING ENHANCEMENTS
Each subject progress ring (.progress-ring) in the sidebar:
- Add a completion flash animation: when a ring hits 100%, play a quick radial pulse (scale 1 → 1.2 → 1, opacity 1 → 0) behind the ring
- Add a number that counts up smoothly when the progress value changes (CSS counter-based or JS — mark it as TODO for JS prompt)
- Ring stroke should have a rounded linecap: stroke-linecap: round on the SVG element

8. TOAST NOTIFICATION UPGRADES
The existing toast (.toast):
- Should enter from the right with a spring-like overshoot: @keyframes toastSpring — translateX(120px)→translateX(-8px)→translateX(0)
- Should have an auto-progress bar at the bottom: a thin line that depletes over 3 seconds (CSS animation width 100%→0%)
- Should support variants by class: .toast-success (green left border), .toast-warning (amber), .toast-info (blue), .toast-calm (green with breathing effect)

9. KEYBOARD SHORTCUT MODAL OVERLAY
Add CSS for a keyboard shortcut reference modal (#shortcut-modal):
- Full-screen backdrop: rgba(44,44,44,0.6), backdrop-filter: blur(8px)
- Centered card: max-width 480px, white background, border-radius 16px, generous padding
- Shortcut rows: two-column layout with key badge on left (small rounded pill, monospace font, border) and description on right
- Enter animation: scale(0.9)→scale(1), opacity 0→1, 0.3s ease

10. ONBOARDING TOUR SPOTLIGHT
Add CSS for the onboarding tour spotlight (#tour-spotlight):
- A full-viewport overlay with a "hole" cut out over the highlighted element
- Use SVG clipPath or box-shadow: 0 0 0 9999px rgba(44,44,44,0.7) to create the tunnel effect
- A tooltip card that appears near the highlighted element: white card, soft shadow, arrow pointer
- Tour progress dots at bottom of overlay

11. RESEARCH OVERLAY (Ctrl+R)
Add CSS for #research-overlay:
- Full-screen white overlay, overflow-y: scroll
- Academic poster layout: max-width 1000px, centered, 2-column grid for most sections
- Section cards: white background, 1px border, subtle shadow, border-radius 8px
- Color-coded section badges: methodology (blue), HCI principles (green), limitations (amber), references (muted)
- A print stylesheet (@media print) that: removes the overlay toggle button, sets everything to black on white, uses Playfair Display for headings at correct print sizes

12. ANIMATED SCORE NUMBER IN NAVBAR GAUGE
The score number displayed inside the SVG gauge:
- Should animate as a counter: when score changes from 45 to 78, the number should count upward (30fps)
- CSS cannot do this alone — add a class .gauge-number-changing and a CSS keyframe that adds a subtle pulse on the number during the count

13. BOTTOM STATUS BAR ENHANCEMENTS
The existing bottom status bar:
- Left section "Adaptive Mode: Active" should have a slow pulsing green dot (3px circle, @keyframes pulse: opacity 0.4→1→0.4, 2s loop)
- Center status text should have a character-by-character reveal animation when it changes: clip-path or letter-spacing based
- Right section "Session Quality" text should transition color smoothly (green/amber/coral) matching load state

14. MOBILE ENHANCEMENTS (below 900px)
Upgrade the existing responsive behavior:
- Add a floating action button (FAB) at bottom-right: 48px circle, shadow, hamburger icon → X icon toggle
- The FAB opens a bottom sheet drawer with quick actions: flip card, skip, demo mode
- Bottom sheet: slides up from bottom, rounded top corners, drag handle indicator

15. PRINT STYLESHEET
@media print:
- Hide: navbar, sidebar, right panel, bottom bar, all buttons, toast, overlays
- Show only: main study card area and any active research overlay content
- Force white background, black text
- Playfair Display headings, DM Sans body
- Add "Printed from AdaptiveStudy — HCI Prototype" footer on each page

Write complete CSS for all 15 additions. Integrate cleanly with the existing variable system. Do not remove or override existing rules — only add.
```

---

# ═══════════════════════════════════════
# PROMPT 2 — index.html: Semantic Perfection + New Panels
# ═══════════════════════════════════════

**File to edit:** `index.html`
**What this does:** Adds ARIA accessibility, the Research Overlay, Keyboard Shortcut Modal, Onboarding Tour scaffold, custom cursor element, and all missing IDs referenced by new JS.

```
You are upgrading index.html for AdaptiveStudy — a cognitive load-aware study dashboard.

The existing HTML already has:
- Fixed top navbar (#navbar) with logo, load gauge SVG, mode badge, demo button
- Left sidebar (#sidebar) with topic pills, progress rings, session timer
- Main content area with flashcard (#flashcard), study notes (#study-notes), action buttons
- Right panel (#right-panel) with 4 metric bars and sparkline (#sparkline-canvas)
- Bottom status bar

Make ALL of the following additions WITHOUT removing existing structure:

---

ADDITION 1: CUSTOM CURSOR ELEMENT
Add immediately after <body> opens:
<div id="cursor-dot" aria-hidden="true"></div>
<div id="cursor-ring" aria-hidden="true"></div>

ADDITION 2: BACKGROUND MESH AND STATE WASH
Add after cursor elements:
<div class="bg-mesh" aria-hidden="true"></div>
<div id="state-wash" aria-hidden="true"></div>

ADDITION 3: ARIA LABELS ON EXISTING ELEMENTS
Add these attributes to existing elements:
- Navbar: role="banner"
- Sidebar: role="navigation" aria-label="Study topics and progress"
- Main content: role="main" aria-label="Active study area"
- Right panel: role="complementary" aria-label="Cognitive load monitor"
- Bottom bar: role="contentinfo"
- The load gauge SVG: aria-label="Mental load score" aria-live="polite" aria-atomic="true"
- The mode badge: aria-live="polite"
- The flashcard: role="region" aria-label="Flashcard" aria-live="polite"
- All action buttons: add descriptive aria-label attributes
- Status text in bottom bar: aria-live="polite" aria-atomic="true"

ADDITION 4: FLASHCARD UPGRADES (inside existing flashcard structure)
Inside the flashcard card, add:
- A subject badge: <span class="card-subject" id="card-subject"></span> — top-left inside front face
- A difficulty badge: <span class="card-difficulty" id="card-difficulty"></span> — top-right inside front face
- A card counter: <span class="card-counter" id="card-counter">Card 1 of 20</span> — below the question
- A confidence rating row on the BACK face (appears after flip):
  <div class="confidence-row" id="confidence-row">
    <span class="conf-label">How well did you know this?</span>
    <div class="conf-buttons">
      <button class="conf-btn" data-confidence="1" aria-label="I had no idea">😕 Didn't Know</button>
      <button class="conf-btn" data-confidence="2" aria-label="I partially knew">🤔 Partly</button>
      <button class="conf-btn" data-confidence="3" aria-label="I knew it well">✓ Got It</button>
    </div>
  </div>

ADDITION 5: SESSION ANALYTICS PANEL (inside right panel, below sparkline)
After the sparkline section, add:
<section class="analytics-section" id="analytics-section">
  <h3 class="panel-section-title">Session Stats</h3>
  <div class="stat-grid">
    <div class="stat-tile">
      <span class="stat-value" id="stat-cards-seen">0</span>
      <span class="stat-label">Cards Seen</span>
    </div>
    <div class="stat-tile">
      <span class="stat-value" id="stat-cards-learned">0</span>
      <span class="stat-label">Learned</span>
    </div>
    <div class="stat-tile">
      <span class="stat-value" id="stat-calm-time">0%</span>
      <span class="stat-label">Calm Time</span>
    </div>
    <div class="stat-tile">
      <span class="stat-value" id="stat-avg-load">—</span>
      <span class="stat-label">Avg Load</span>
    </div>
  </div>
  <button class="export-btn" id="btn-export-report" aria-label="Export session report">
    ↓ Export Session Report
  </button>
</section>

ADDITION 6: KEYBOARD SHORTCUT MODAL
Add before </body>:
<div id="shortcut-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" hidden>
  <div class="modal-card">
    <button class="modal-close" id="btn-close-shortcuts" aria-label="Close shortcuts">✕</button>
    <h2 class="modal-title">Keyboard Shortcuts</h2>
    <div class="shortcut-list">
      <div class="shortcut-row"><kbd>Space</kbd><span>Flip flashcard</span></div>
      <div class="shortcut-row"><kbd>→</kbd><span>Next card</span></div>
      <div class="shortcut-row"><kbd>L</kbd><span>Mark as Learned</span></div>
      <div class="shortcut-row"><kbd>R</kbd><span>Flag for Review</span></div>
      <div class="shortcut-row"><kbd>D</kbd><span>Toggle Demo Mode</span></div>
      <div class="shortcut-row"><kbd>Ctrl</kbd><kbd>R</kbd><span>Research Overlay</span></div>
      <div class="shortcut-row"><kbd>?</kbd><span>This shortcut guide</span></div>
      <div class="shortcut-row"><kbd>Esc</kbd><span>Close any overlay</span></div>
    </div>
  </div>
</div>

ADDITION 7: RESEARCH OVERLAY (Ctrl+R)
Add before </body>:
<div id="research-overlay" class="research-overlay" role="dialog" aria-modal="true" aria-label="HCI Research Report" hidden>
  <div class="research-content">
    <button class="research-close" id="btn-close-research" aria-label="Close research overlay">✕ Close</button>
    <button class="research-print" onclick="window.print()" aria-label="Print research report">⎙ Print</button>

    <header class="research-header">
      <h1>Cognitive Load-Aware Interface Design</h1>
      <h2>AdaptiveStudy — HCI Prototype Research Report</h2>
      <p class="research-subtitle">Behavioral signal fusion for real-time interface adaptation in educational environments</p>
    </header>

    <div class="research-grid">
      <section class="research-card research-full">
        <div class="research-badge research-badge-blue">Abstract</div>
        <p id="research-abstract">AdaptiveStudy demonstrates real-time cognitive load estimation through passive behavioral monitoring, adapting the study interface to reduce extraneous cognitive load and support learning efficiency. Four interaction signals — cursor entropy, hesitation index, error rate, and scroll rhythm — are fused into a composite Mental Load Score using weighted exponential smoothing. When overload is detected, the interface transitions to Calm Mode, reducing visual complexity and filtering content difficulty.</p>
      </section>

      <section class="research-card">
        <div class="research-badge research-badge-blue">Methodology</div>
        <ul class="research-list">
          <li><strong>Cursor Entropy (25%):</strong> Angular deviation in mouse movement vectors</li>
          <li><strong>Hesitation Index (35%):</strong> Inter-event timing and hover pauses</li>
          <li><strong>Error Rate (25%):</strong> Backspace/delete frequency in 30s window</li>
          <li><strong>Scroll Rhythm (15%):</strong> Speed and direction-reversal frequency</li>
          <li><strong>EMA Smoothing:</strong> α = 0.3, 3-reading debounce before mode switch</li>
        </ul>
      </section>

      <section class="research-card">
        <div class="research-badge research-badge-green">HCI Principles Applied</div>
        <ul class="research-list">
          <li><strong>Cognitive Load Theory</strong> (Sweller 1988)</li>
          <li><strong>Miller's Law</strong> — chunk reduction in Calm Mode</li>
          <li><strong>Fitts' Law</strong> — larger targets under high load</li>
          <li><strong>Progressive Disclosure</strong> — complexity hides on overload</li>
          <li><strong>Aesthetic-Usability Effect</strong> — calm palette reduces stress</li>
          <li><strong>Nielsen's Heuristic #1</strong> — explicit mode transition toasts</li>
        </ul>
      </section>

      <section class="research-card research-full">
        <div class="research-badge research-badge-blue">Live Session Metrics</div>
        <div class="research-live-grid">
          <div class="research-live-tile"><span id="research-avg-score">—</span><label>Average Load Score</label></div>
          <div class="research-live-tile"><span id="research-peak-score">—</span><label>Peak Load Score</label></div>
          <div class="research-live-tile"><span id="research-calm-pct">—</span><label>Time in Calm Mode</label></div>
          <div class="research-live-tile"><span id="research-switches">—</span><label>Mode Switches</label></div>
          <div class="research-live-tile"><span id="research-cards-done">—</span><label>Cards Completed</label></div>
          <div class="research-live-tile"><span id="research-session-time">—</span><label>Session Duration</label></div>
        </div>
      </section>

      <section class="research-card">
        <div class="research-badge research-badge-amber">Limitations</div>
        <ul class="research-list">
          <li>Behavioral proxies, not physiological ground truth</li>
          <li>No EEG, pupillometry, or GSR integration</li>
          <li>No per-user baseline calibration</li>
          <li>Rule-based thresholds, not ML-derived</li>
          <li>Static content deck</li>
        </ul>
      </section>

      <section class="research-card">
        <div class="research-badge research-badge-green">Future Work</div>
        <ul class="research-list">
          <li>Web Bluetooth API for EEG headset integration</li>
          <li>Spaced repetition (SM-2 / FSRS) algorithm</li>
          <li>Per-user calibration phase on first run</li>
          <li>Longitudinal session analytics dashboard</li>
          <li>Formal within-subjects usability study</li>
        </ul>
      </section>

      <section class="research-card research-full">
        <div class="research-badge research-badge-muted">References</div>
        <ol class="research-refs">
          <li>J. Sweller, "Cognitive load during problem solving," <em>Cognitive Science</em>, vol. 12, pp. 257–285, 1988.</li>
          <li>F. Paas, A. Renkl, J. Sweller, "Cognitive load theory," <em>Educational Psychologist</em>, vol. 38, pp. 1–4, 2003.</li>
          <li>S. G. Hart and L. E. Staveland, "NASA-TLX development," <em>Human Mental Workload</em>, vol. 1, pp. 139–183, 1988.</li>
          <li>G. A. Miller, "The magical number seven," <em>Psychological Review</em>, vol. 63, pp. 81–97, 1956.</li>
          <li>T. Yamauchi et al., "Reading emotion from mouse cursor motions," <em>Cognitive Science</em>, vol. 41, pp. 771–806, 2017.</li>
        </ol>
      </section>
    </div>
  </div>
</div>

ADDITION 8: ONBOARDING TOUR OVERLAY
Add before </body>:
<div id="onboarding-overlay" class="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Welcome tour" hidden>
  <div id="tour-spotlight" class="tour-spotlight"></div>
  <div id="tour-tooltip" class="tour-tooltip">
    <div class="tour-step-badge" id="tour-step-badge">Step 1 of 6</div>
    <h3 class="tour-title" id="tour-title"></h3>
    <p class="tour-body" id="tour-body"></p>
    <div class="tour-nav">
      <button id="btn-tour-prev" class="tour-btn-sec">← Back</button>
      <div class="tour-dots" id="tour-dots"></div>
      <button id="btn-tour-next" class="tour-btn-pri">Next →</button>
    </div>
  </div>
</div>

ADDITION 9: HELP BUTTON IN NAVBAR
Inside the navbar, after the demo button, add:
<button class="nav-btn" id="btn-shortcuts" aria-label="Keyboard shortcuts (press ?)">⌨ Shortcuts</button>
<button class="nav-btn" id="btn-tour" aria-label="Start guided tour">◎ Tour</button>

ADDITION 10: CONFIDENCE STATS IN SIDEBAR (below progress rings)
In the sidebar, after the progress rings section, add:
<section class="sidebar-section" id="mastery-section">
  <h3 class="sidebar-section-title">Mastery Overview</h3>
  <div class="mastery-bar-list" id="mastery-bar-list">
    <!-- Populated by JS: one row per subject showing mastery % -->
  </div>
</section>

All additions must use semantic HTML5. All interactive elements must have aria-label. All new IDs must be unique. Write the complete upgraded index.html.
```

---

# ═══════════════════════════════════════
# PROMPT 3 — cognitive-engine.js: Calibration + Confidence
# ═══════════════════════════════════════

**File to edit:** `js/cognitive-engine.js`
**What this does:** Adds a 15-second calibration phase on first load to establish the user's personal baseline, adds a signal quality/confidence score, and adds per-session min/max/average tracking.

```
You are upgrading js/cognitive-engine.js for AdaptiveStudy.

The existing engine already:
- Tracks 4 sensors: cursorEntropy, hesitationIndex, errorRate, scrollRhythm
- Computes weighted composite with EMA smoothing
- Exposes getMentalLoadScore(), getLoadState(), getMetrics(), startPolling(), stopPolling()

ADD the following capabilities WITHOUT removing anything:

---

ADDITION 1: CALIBRATION PHASE
Add a 15-second calibration phase that runs on the first startPolling() call.

During calibration:
- Collect raw sensor values for 15 seconds (30 readings at 500ms)
- Do NOT emit composite scores to the callback during calibration (emit null or a calibration object instead)
- After 15 seconds, compute personal baselines:
  - this.baselineCursor: mean cursor entropy during calibration
  - this.baselineHesitation: mean hesitation during calibration
  - this.baselineScroll: mean scroll rhythm during calibration
- After calibration, subtract baseline from each sensor before normalizing
  (so a user who always moves their mouse fast won't be permanently flagged as high-entropy)
- Expose: isCalibrating (boolean), calibrationProgress (0–100), calibrationComplete (boolean)
- During calibration, emit: { calibrating: true, progress: 0-100 } to the polling callback

ADDITION 2: SIGNAL QUALITY / CONFIDENCE SCORE
Add a confidence score (0–100) that reflects how much useful data the engine has:
- Starts at 0
- Increases as more events are received (mouse moves, clicks, keystrokes, scrolls)
- Low confidence (<30): user hasn't interacted much — score is unreliable
- High confidence (>70): enough data for reliable estimation
- Expose as: getConfidence() → number 0-100
- Also expose: getSignalQuality() → object with per-sensor confidence levels

ADDITION 3: SESSION STATISTICS TRACKING
Throughout the session, track:
- this.sessionMin: lowest composite score seen
- this.sessionMax: highest composite score seen
- this.sessionScoreHistory: array of all composite scores (capped at 500)
- this.sessionAvg: running exponential average of all scores
- this.timeInLow / this.timeInMedium / this.timeInHigh: milliseconds spent in each state
- this.modeSwitchCount: how many times state changed
- this.sessionStartTime: Date.now() when polling started

Expose via: getSessionStats() → { min, max, avg, timeInLow, timeInMedium, timeInHigh, modeSwitchCount, durationMs, confidence }

ADDITION 4: NOISE INJECTION CONTROL
Currently the engine injects ±2 random noise per tick for realism.
Make this configurable:
- this.noiseLevel = 2 (default)
- Add: setNoiseLevel(n) method
- In Demo Mode (set via setDemoMode(true)), noise should be 0 so the curve is smooth

ADDITION 5: EVENT COUNTING
Track total events received per sensor type:
- this.eventCounts = { mouseMove: 0, click: 0, keystroke: 0, scroll: 0 }
- Expose via getEventCounts()

ADDITION 6: CALIBRATION UI NOTIFICATION
After calibration completes, call an optional callback if registered:
- Add: onCalibrationComplete(callback) method
- Callback receives: { baselines: { cursor, hesitation, scroll }, confidence: number }

Keep the full existing implementation. Add all new features below the existing code or integrated carefully. Export window.CognitiveEngine = CognitiveEngine as before.
```

---

# ═══════════════════════════════════════
# PROMPT 4 — ui-adapter.js: Cinematic Transitions
# ═══════════════════════════════════════

**File to edit:** `js/ui-adapter.js`
**What this does:** Upgrades all visual transitions to cinematic quality — animated number counters, wave ripple on mode change, calibration progress display, confidence indicator, and the custom cursor wiring.

```
You are upgrading js/ui-adapter.js for AdaptiveStudy.

The existing adapter already:
- Updates 4 metric bars with color transitions
- Updates the navbar SVG load gauge (arc + color)
- Updates bottom status text and session quality
- Debounces mode transitions (3 readings)
- Activates/deactivates Calm Mode
- Shows toast notifications
- Renders sparkline SVG

ADD the following capabilities WITHOUT removing anything:

---

ADDITION 1: ANIMATED NUMBER COUNTER
Add a method: animateNumber(element, fromValue, toValue, duration=600)
- Animates a numeric value from fromValue to toValue over duration ms
- Uses requestAnimationFrame for smooth 60fps animation
- Applies Math.round for integers, .toFixed(1) for decimals
- Use this for: gauge score number, all stat tiles, session stats
- Also apply to metric bar numeric labels (right-side numbers)

ADDITION 2: CUSTOM CURSOR WIRING
Add to constructor:
- Get #cursor-dot and #cursor-ring elements
- On document mousemove: update their transform: translate() with raw clientX/clientY
- On hover of interactive elements (buttons, .card, .topic-pill): add class .cursor-expanded to #cursor-ring
- On mousedown: add .cursor-pressed, remove on mouseup
- Use requestAnimationFrame for cursor position updates (not direct mousemove) for smoothness

ADDITION 3: LIQUID CARD TILT
On each .card element:
- Add mousemove listener that computes the mouse position within the card (0–1 range)
- Set CSS vars --card-rotate-x and --card-rotate-y based on position
- --card-rotate-x: (posY - 0.5) * -6 deg (max 3deg each side)
- --card-rotate-y: (posX - 0.5) * 6 deg
- On mouseleave: reset to 0 with a 0.3s transition

ADDITION 4: MODE TRANSITION WAVE EFFECT
When Calm Mode activates or deactivates:
- Create a temporary div.mode-wave that:
  - Starts as a small circle at the center of the screen
  - Rapidly expands to cover the full viewport (scale from 0 to 3, opacity 1→0)
  - Color: rgba(107,175,122,0.15) for Calm, rgba(106,155,181,0.1) for Focus
  - Duration: 800ms
  - Removed from DOM after animation ends
- This creates a beautiful ripple transition effect

ADDITION 5: CALIBRATION PROGRESS DISPLAY
Add: showCalibrationState(progress, isComplete)
- If not complete: show a slim progress bar below the navbar (or inside it)
  - Bar fills from 0 to 100% over 15 seconds
  - Label: "Calibrating to your baseline... X%"
  - Color: --accent-blue
- On complete: bar disappears with a fade, toast appears: "✓ Calibrated to your interaction style"

ADDITION 6: SIGNAL CONFIDENCE INDICATOR
In the right panel, below the 4 metric bars, add a confidence display:
- updateConfidence(score) method
- Updates a #confidence-indicator element (add to HTML in prompt 2)
- Shows "Signal Confidence: XX%" with a color-coded label
- Low (<30): amber, "Still learning your baseline..."
- Medium (30-70): blue, "Calibrated"
- High (>70): green, "High confidence"

ADDITION 7: STAT TILE UPDATES
Add: updateSessionStats(stats) method
- Updates all 4 stat tiles in #analytics-section:
  - #stat-cards-seen: stats.cardsSeen
  - #stat-cards-learned: stats.learned
  - #stat-calm-time: (stats.calmPct).toFixed(0) + "%"
  - #stat-avg-load: stats.avgLoad.toFixed(0)
- Use animateNumber() for smooth value transitions

ADDITION 8: RESEARCH OVERLAY LIVE DATA
Add: updateResearchOverlay(stats) method
- Updates the live metric tiles inside #research-overlay:
  - #research-avg-score, #research-peak-score, #research-calm-pct
  - #research-switches, #research-cards-done, #research-session-time

ADDITION 9: TOAST VARIANTS
Upgrade showToast(message, type='info', duration=3000):
- type parameter: 'success', 'warning', 'info', 'calm', 'error'
- Each type applies the corresponding CSS class (.toast-success etc.)
- Success toast: checkmark icon prefix ✓
- Calm toast: leaf icon prefix 🌿
- Warning toast: ⚠ prefix

ADDITION 10: MASTERY BAR LIST
Add: updateMasteryBars(subjectProgress) method
- subjectProgress: { Biology: 0.75, Physics: 0.25, ... }
- Renders or updates horizontal bars in #mastery-bar-list
- Each bar: subject label + animated fill bar + percentage text
- Color: green if >66%, amber if 33-66%, coral if <33%

Keep all existing code. Export window.UIAdapter = UIAdapter as before.
```

---

# ═══════════════════════════════════════
# PROMPT 5 — study-content.js: Spaced Repetition + Confidence
# ═══════════════════════════════════════

**File to edit:** `js/study-content.js`
**What this does:** Adds per-card confidence ratings, a simplified SM-2-inspired spaced repetition scheduler, per-card analytics, and a mastery level system.

```
You are upgrading js/study-content.js for AdaptiveStudy.

The existing module already:
- Defines 20 flashcards across 5 subjects with easy/medium/hard difficulty
- Shuffles the deck
- Renders current card
- Flips, navigates, marks learned/review
- Updates progress rings
- Filters by subject and load state

ADD the following WITHOUT removing anything:

---

ADDITION 1: CONFIDENCE RATING SYSTEM
Add: recordConfidence(cardId, rating) — rating is 1 (didn't know), 2 (partly), 3 (got it)
- Store in this.confidenceHistory: { [cardId]: [rating1, rating2, ...] }
- Compute per-card mastery: average of last 3 confidence ratings
- Cards with mastery > 2.5 are considered "mastered"
- Cards with mastery < 1.5 are flagged as "struggle cards"

ADDITION 2: SIMPLIFIED SPACED REPETITION
Implement a lightweight SM-2-inspired scheduler:
- Each card has: nextReviewScore (starts at 0), interval (starts at 1), easeFactor (starts at 2.5)
- After confidence rating:
  - rating 1: interval = 1, easeFactor -= 0.2 (min 1.3)
  - rating 2: interval unchanged, easeFactor unchanged
  - rating 3: interval = max(1, interval * easeFactor), easeFactor += 0.1
- getNextReviewOrder(): returns deck sorted by nextReviewScore ascending (most due first)
- Add a "Due for Review" filter mode that shows only cards past their interval

ADDITION 3: PER-CARD ANALYTICS
Track for each card:
- this.cardStats[cardId] = { seen: 0, flipped: 0, learned: false, reviewFlagged: false, avgConfidence: null, lastSeen: null }
- Increment seen each time the card is rendered
- Increment flipped each time the card is flipped
- Record timestamp in lastSeen
- Expose: getCardAnalytics(cardId) and getAllCardStats()

ADDITION 4: SUBJECT MASTERY LEVELS
Add: getSubjectMastery() → { Biology: { level: 'Beginner'|'Developing'|'Proficient'|'Mastered', pct: 0.75 }, ... }
- Level based on average confidence across all subject cards:
  - 0–25%: Beginner
  - 25–50%: Developing
  - 50–80%: Proficient
  - 80–100%: Mastered
- Return both the label and the numeric ratio

ADDITION 5: STRUGGLE CARD HIGHLIGHTING
Add: getStruggleCards() → array of card objects where avgConfidence < 1.5
- These are cards the user consistently gets wrong
- In Calm Mode, prioritize showing these first (they need attention but get easier cards)
- Actually: in Calm Mode HIGH load, show EASY struggle cards if any exist, otherwise show easy non-struggle

ADDITION 6: CARD TRANSITION ANIMATION
Upgrade nextCard() and prevCard():
- Add a class .card-exiting to the flashcard element before changing content
- Wait 200ms (CSS transition time)
- Change content
- Remove .card-exiting, add .card-entering
- Remove .card-entering after 200ms
This creates a smooth slide/fade between cards.

ADDITION 7: ENHANCED RENDER
Upgrade renderCard() to also:
- Update #card-subject with current card's subject
- Update #card-difficulty with current card's difficulty and the appropriate class (easy/medium/hard)
- Update #card-counter with "Card X of Y" where Y is the current filtered deck length
- Hide/show the confidence row (#confidence-row) based on whether card is flipped
- Track this card as seen in cardStats

ADDITION 8: SESSION SUMMARY
Add: getSessionSummary() → {
  totalSeen, totalLearned, totalReview, masteredThisSession,
  struggleCards: [], subjectMastery: {}, avgConfidence, topSubject, weakSubject
}
Used by the export function.

Export as: window.StudyContent = new StudyContent() as before.
```

---

# ═══════════════════════════════════════
# PROMPT 6 — analytics.js: NEW FILE — Session Analytics Engine
# ═══════════════════════════════════════

**File to create:** `js/analytics.js`
**What this does:** Standalone analytics module that generates an exportable PDF-like session report as an HTML string, and tracks all session events for display in the stats tiles.

```
Create a NEW file js/analytics.js for AdaptiveStudy.

This module tracks the full session and can generate an exportable session report.

Implement class SessionAnalytics:

PROPERTY: this.events = []
Every significant session event gets logged:
{ timestamp, type, data }
Event types: 'session_start', 'mode_change', 'card_seen', 'card_learned', 'card_review', 'confidence_rated', 'load_sample', 'calibration_complete', 'pomodoro_alert'

METHOD: logEvent(type, data={})
- Pushes { timestamp: Date.now(), type, data } to this.events

METHOD: logLoadSample(score, state)
- Shorthand for logging load readings
- Also maintains rolling averages and per-state time counters
- this.totalSamples++
- this.scoreSum += score
- this.lastState tracking for time-in-state calculation

METHOD: getStats()
Returns:
{
  sessionDurationMs: number,
  avgLoadScore: number,
  peakLoadScore: number,
  minLoadScore: number,
  timeInLow: ms,
  timeInMedium: ms,
  timeInHigh: ms,
  calmModePct: 0-100 (percent of time score was high),
  modeSwitchCount: number,
  cardsSeen: number,
  cardsLearned: number,
  cardsReview: number,
  avgConfidence: number | null,
  calibrated: boolean,
  eventLog: this.events (last 100)
}

METHOD: generateReportHTML()
Returns a full self-contained HTML string of a session report:
- Title: "AdaptiveStudy — Session Report"
- Date and duration
- Key metrics in a card grid: avg load, peak load, calm time %, cards learned
- A text sparkline (ASCII art style using block characters) of the load history
- Subject mastery table (populated from StudyContent if available)
- Top 3 struggle cards listed
- Session event log (last 20 events, formatted as timeline)
- Styled with inline CSS using the AdaptiveStudy color palette
  (warm ivory #FAF8F3 background, Playfair Display headings, DM Sans body)
- This HTML is opened in a new window via window.open() + document.write()

METHOD: exportReport()
- Calls generateReportHTML()
- Opens new window: const w = window.open(); w.document.write(html); w.document.close();
- Also attempts window.print() on the new window after a short delay

METHOD: getLoadHistory()
- Returns array of last 60 score samples for sparkline rendering

Export as: window.SessionAnalytics = new SessionAnalytics()
```

---

# ═══════════════════════════════════════
# PROMPT 7 — onboarding.js: NEW FILE — Guided First-Run Tour
# ═══════════════════════════════════════

**File to create:** `js/onboarding.js`
**What this does:** A 6-step guided tour that highlights each panel of the interface on first visit, with spotlight and tooltip positioning.

```
Create a NEW file js/onboarding.js for AdaptiveStudy.

This module manages a first-run guided tour of the interface.

Implement class OnboardingTour:

PROPERTY: steps = array of 6 tour step objects:
Each step: { title, body, targetSelector, position: 'top'|'bottom'|'left'|'right'|'center' }

Step 1: { title: "Welcome to AdaptiveStudy", body: "This dashboard adapts to your cognitive state in real time. Let's take a quick tour.", targetSelector: null, position: 'center' }
Step 2: { title: "Mental Load Gauge", body: "This circle shows your live cognitive load score from 0–100, computed from your mouse movement, typing rhythm, and scroll behavior.", targetSelector: "#navbar", position: 'bottom' }
Step 3: { title: "Live Cognitive Sensors", body: "These four bars show the raw readings from each behavioral sensor. Watch them move as you interact.", targetSelector: "#right-panel", position: 'left' }
Step 4: { title: "Your Study Cards", body: "Flashcards adapt to your load state — when you're overwhelmed, harder cards are hidden automatically.", targetSelector: ".study-card", position: 'top' }
Step 5: { title: "Subject Navigation", body: "Browse topics here and track your progress per subject with the rings.", targetSelector: "#sidebar", position: 'right' }
Step 6: { title: "Demo Mode", body: "Hit the Demo button to simulate a cognitive load curve — great for showing how the interface adapts.", targetSelector: "#btn-demo", position: 'bottom' }

METHOD: start()
- Set #onboarding-overlay to not hidden (visible)
- currentStep = 0
- Call showStep(0)

METHOD: showStep(index)
- Get the target element by step.targetSelector
- If null: center the tooltip in the viewport
- If exists: position #tour-spotlight over the element (getBoundingClientRect + scroll offset)
- Position #tour-tooltip near the element based on step.position
- Update #tour-title, #tour-body, #tour-step-badge ("Step X of 6")
- Update dot indicators in #tour-dots
- Update prev/next button visibility (#btn-tour-prev hidden on step 0)

METHOD: next()
- currentStep++
- If currentStep >= steps.length: call complete()
- Else: showStep(currentStep)

METHOD: prev()
- currentStep = Math.max(0, currentStep - 1)
- showStep(currentStep)

METHOD: complete()
- Hide #onboarding-overlay
- Set localStorage key 'adaptivestudy-tour-complete' = '1'
- Show toast: "✓ Tour complete! Press ? for keyboard shortcuts."

METHOD: shouldShow()
- Returns: localStorage.getItem('adaptivestudy-tour-complete') !== '1'

Wire up: #btn-tour-next → next(), #btn-tour-prev → prev()

Export as: window.OnboardingTour = new OnboardingTour()
```

---

# ═══════════════════════════════════════
# PROMPT 8 — dashboard.js: Full Orchestration Upgrade
# ═══════════════════════════════════════

**File to edit:** `js/dashboard.js`
**What this does:** Wires all new modules together, handles calibration state, exports, onboarding, keyboard shortcut modal, research overlay, and all new button/event bindings.

```
You are upgrading js/dashboard.js for AdaptiveStudy.

The existing dashboard already:
- Instantiates engine, ui, content
- Starts session timer and Pomodoro alert
- Polls CognitiveEngine every 500ms
- Sends metrics to UIAdapter and StudyContent
- Wires all buttons and topic pills
- Restores notes from localStorage
- Runs Demo Mode
- Supports keyboard shortcuts

ADD the following WITHOUT removing anything:

---

ADDITION 1: INSTANTIATE NEW MODULES
At the top of DOMContentLoaded:
const analytics = window.SessionAnalytics;
const tour = window.OnboardingTour;

ADDITION 2: CALIBRATION HANDLING
Register calibration callback:
engine.onCalibrationComplete((data) => {
  ui.showCalibrationState(100, true);
  ui.showToast('✓ Calibrated to your interaction style', 'success');
  analytics.logEvent('calibration_complete', data);
});

In the polling callback, check if calibrating:
if (metrics.calibrating) {
  ui.showCalibrationState(metrics.progress, false);
  return; // Don't process load until calibration done
}

ADDITION 3: ANALYTICS LOGGING IN POLLING LOOP
In the main polling callback (every 500ms):
analytics.logLoadSample(metrics.composite, metrics.state);
ui.updateSessionStats(analytics.getStats());
ui.updateResearchOverlay({ ...analytics.getStats(), ...content.getSessionSummary() });
ui.updateMasteryBars(content.getSubjectMastery());
ui.updateConfidence(engine.getConfidence());

ADDITION 4: CONFIDENCE RATING BUTTONS
Wire the confidence buttons on the flashcard back face:
document.querySelectorAll('.conf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const rating = parseInt(btn.dataset.confidence);
    const card = content.getCurrentCard();
    content.recordConfidence(card.id, rating);
    analytics.logEvent('confidence_rated', { cardId: card.id, rating });
    content.nextCard();
    analytics.logEvent('card_seen', { subject: content.getCurrentCard().subject });
  });
});

ADDITION 5: EXPORT REPORT BUTTON
document.getElementById('btn-export-report')?.addEventListener('click', () => {
  analytics.exportReport();
});

ADDITION 6: RESEARCH OVERLAY TOGGLE
Wire Ctrl+R:
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'r') {
    e.preventDefault();
    const overlay = document.getElementById('research-overlay');
    overlay.hidden = !overlay.hidden;
  }
  if (e.key === '?') {
    document.getElementById('shortcut-modal').hidden = false;
  }
  if (e.key === 'Escape') {
    document.getElementById('shortcut-modal').hidden = true;
    document.getElementById('research-overlay').hidden = true;
  }
});

document.getElementById('btn-close-research')?.addEventListener('click', () => {
  document.getElementById('research-overlay').hidden = true;
});
document.getElementById('btn-close-shortcuts')?.addEventListener('click', () => {
  document.getElementById('shortcut-modal').hidden = true;
});

ADDITION 7: ONBOARDING TOUR
// Wire tour buttons (done in onboarding.js but confirm wiring here)
document.getElementById('btn-tour')?.addEventListener('click', () => {
  tour.start();
});
// Auto-start on first visit after short delay
if (tour.shouldShow()) {
  setTimeout(() => tour.start(), 1800);
}

ADDITION 8: KEYBOARD SHORTCUTS BUTTON
document.getElementById('btn-shortcuts')?.addEventListener('click', () => {
  document.getElementById('shortcut-modal').hidden = false;
});

ADDITION 9: CARD SEEN ANALYTICS
In the existing nextCard / markLearned / markReview handlers:
- analytics.logEvent('card_seen', { subject: ..., difficulty: ... })
- analytics.logEvent('card_learned', { cardId: ... }) for learned
- analytics.logEvent('card_review', { cardId: ... }) for review

ADDITION 10: UPDATED DEMO MODE
In the Demo Mode simulation callback:
- Call engine.setNoiseLevel(0) on start (smooth curve)
- Call engine.setNoiseLevel(2) on end (restore)
- Log analytics.logEvent('demo_mode_start') and 'demo_mode_end'

ADDITION 11: ESCAPE KEY CLOSES MODAL
Ensure Escape closes both modals cleanly:
if (e.key === 'Escape') {
  document.querySelectorAll('.modal-overlay, .research-overlay, .onboarding-overlay').forEach(el => {
    el.hidden = true;
  });
}

Keep all existing functionality. Do not remove any existing wiring.
```

---

# ═══════════════════════════════════════
# PROMPT 9 — index.html: Script Tags for New Files
# ═══════════════════════════════════════

**File to edit:** `index.html` (small addition)
**What this does:** Adds the 2 new JS files to the script loading order.

```
In index.html, find the existing <script> tags near the closing </body>.
They currently load (in order):
  js/cognitive-engine.js
  js/ui-adapter.js
  js/study-content.js
  js/dashboard.js

Change the order to:
  js/cognitive-engine.js
  js/study-content.js
  js/ui-adapter.js
  js/analytics.js        ← ADD THIS (before dashboard)
  js/onboarding.js       ← ADD THIS (before dashboard)
  js/dashboard.js

Make no other changes to the file.
```

---

# ═══════════════════════════════════════
# PROMPT 10 — README.md: Professional Repository Documentation
# ═══════════════════════════════════════

**File to create:** `README.md` (in project root)
**What this does:** Creates a GitHub-ready README that looks professional and impresses anyone who visits the repo.

```
Create README.md for the AdaptiveStudy project at the root of the repository.

The README must include:

---

# AdaptiveStudy
### A Cognitive Load-Aware Study Dashboard

> "An interface that responds to how you feel, not just what you do."

A static web prototype built for the Human-Computer Interaction course (702CO0E007) demonstrating real-time cognitive load estimation and adaptive interface design.

---

## ✦ What It Does
[3-paragraph description of the core concept, how the sensors work, and what Calm Mode does]

## ✦ Live Demo
[Instruction: "No server required — open index.html directly in any modern browser or run: python3 -m http.server 8000 then visit http://localhost:8000"]

## ✦ Key Features
Use a clean list with emoji bullets:
- 🧠 4 behavioral sensors fused into a live Mental Load Score
- 🌿 Calm Mode / Focus Mode adaptive transitions
- 📚 20 flashcards across 5 subjects with difficulty adaptation
- 📊 Live cognitive metrics panel with sparkline history
- ⏱ Session timer with Pomodoro break suggestion
- 📋 One-click session report export
- ⌨ Full keyboard shortcut support
- 🔬 Research overlay (Ctrl+R) with live session stats
- 🎭 Demo Mode for controlled presentations
- 💾 Notes auto-saved to localStorage

## ✦ Cognitive Load Detection
A table showing all 4 sensors with weight, what they measure, and why they correlate with load.

## ✦ Interface States
Side-by-side description of Focus Mode and Calm Mode with what changes in each.

## ✦ HCI Principles Applied
List: CLT, Miller's Law, Fitts' Law, Progressive Disclosure, Aesthetic-Usability Effect, Nielsen's Heuristic #1

## ✦ Technology Stack
"Zero dependencies. Pure HTML, CSS, and vanilla JavaScript."
Table: HTML5 | CSS3 | Vanilla JS ES6+ | SVG | localStorage API

## ✦ Project Structure
A file tree showing all files and a one-line description of each.

## ✦ Keyboard Shortcuts
A clean table of all shortcuts.

## ✦ Color Palette
A reference table of the exact hex values and their semantic roles.

## ✦ Academic Context
"Built as an HCI course prototype exploring Sweller's Cognitive Load Theory applied to adaptive interface design. Results are heuristic and suitable for demonstration purposes."

## ✦ References
The 5 key references in IEEE format.

---

Style guidelines for the README:
- Use GitHub Markdown
- Use horizontal rules (---) generously
- Keep paragraphs short and punchy
- Tables for structured data
- No walls of text
```

---

# ═══════════════════════════════════════
# PROMPT 11 — CSS: Analytics Stat Tiles + Confidence UI + Mastery Bars
# ═══════════════════════════════════════

**File to edit:** `style.css` (add new rules)
**What this does:** Adds all CSS for the new HTML elements added in Prompts 2 and 3.

```
Add CSS rules to style.css for AdaptiveStudy for these NEW elements:

Do not modify existing rules. Only add new ones.

---

1. STAT TILES (.stat-grid, .stat-tile, .stat-value, .stat-label)
.stat-grid: display grid, 2x2, gap 8px, margin-top 12px
.stat-tile: white background, border-radius 8px, padding 10px 8px, text-align center, border 1px solid var(--border)
.stat-value: Playfair Display, 22px, font-weight bold, color var(--text-primary), display block
.stat-label: DM Sans, 11px, color var(--text-muted), text-transform uppercase, letter-spacing 0.05em

2. EXPORT BUTTON (.export-btn)
Full width, DM Sans 13px, padding 10px, border-radius 8px
Border: 1px solid var(--border), background transparent, color var(--text-secondary)
Hover: background var(--bg-secondary), border-color var(--accent-blue), color var(--accent-blue)
Transition: all 0.2s ease, cursor pointer
margin-top: 12px

3. CONFIDENCE ROW (.confidence-row, .conf-label, .conf-buttons, .conf-btn)
.confidence-row: shown only when card is flipped, padding 16px, border-top 1px solid var(--border)
.conf-label: DM Sans 12px, color var(--text-muted), display block, margin-bottom 8px, text-align center
.conf-buttons: display flex, gap 8px, justify-content center
.conf-btn: DM Sans 13px, padding 8px 14px, border-radius 20px, border 1px solid var(--border)
  background: white, cursor pointer, transition all 0.2s
  Hover: [data-confidence="1"] border-color var(--accent-coral), color var(--accent-coral)
  Hover: [data-confidence="2"] border-color var(--accent-amber), color var(--accent-amber)
  Hover: [data-confidence="3"] border-color var(--accent-green), color var(--accent-green)

4. CARD SUBJECT AND DIFFICULTY BADGES
.card-subject: top-left of flashcard front, DM Sans 10px uppercase, letter-spacing 0.08em, color var(--text-muted)
.card-difficulty: top-right, pill shape, DM Sans 10px
  &.easy: background var(--lt-green), color var(--dk-green)
  &.medium: background var(--lt-amber), color var(--dk-amber)
  &.hard: background var(--lt-coral), color var(--dk-coral)
.card-counter: bottom-center of front, DM Sans 11px, color var(--text-muted)

5. MASTERY BARS (.mastery-bar-list, .mastery-row, .mastery-label, .mastery-track, .mastery-fill, .mastery-pct)
.mastery-bar-list: display flex, flex-direction column, gap 8px, margin-top 8px
.mastery-row: display flex, align-items center, gap 8px
.mastery-label: DM Sans 12px, color var(--text-secondary), width 64px, flex-shrink 0
.mastery-track: flex 1, height 6px, border-radius 3px, background var(--bg-secondary), overflow hidden
.mastery-fill: height 100%, border-radius 3px, transition width 0.8s ease, background var(--accent-green)
  &.medium: background var(--accent-amber)
  &.low: background var(--accent-coral)
.mastery-pct: DM Sans 11px, color var(--text-muted), width 32px, text-align right

6. CALIBRATION BAR (#calibration-bar)
Position: fixed, top 56px (below navbar), left 0, right 0, z-index 200
Height: 3px, background var(--bg-secondary)
Inner div .calibration-fill: height 100%, background var(--accent-blue), transition width 0.5s ease
Label: small text below bar, centered, DM Sans 12px, color var(--text-muted)
Fade out animation when complete

7. CONFIDENCE INDICATOR (#confidence-indicator, .confidence-level)
.confidence-level: DM Sans 12px, padding 6px 10px, border-radius 6px
  &.low: background var(--lt-amber), color var(--dk-amber)
  &.medium: background var(--lt-blue), color var(--dk-blue)
  &.high: background var(--lt-green), color var(--dk-green)

8. CARD TRANSITION ANIMATIONS
.card-exiting: opacity transitions to 0, translateX(-20px), duration 0.2s
.card-entering: starts at opacity 0, translateX(20px), transitions to normal, duration 0.2s

9. RESEARCH OVERLAY FULL STYLING
#research-overlay: position fixed, inset 0, background white, z-index 1000, overflow-y auto
.research-content: max-width 960px, margin 0 auto, padding 40px 32px
.research-header: text-align center, margin-bottom 48px, padding-bottom 32px, border-bottom 2px solid var(--border)
  h1: Playfair Display 36px, color var(--dark-blue)
  h2: DM Sans 18px, color var(--text-secondary), font-weight normal, margin-top 8px
.research-grid: display grid, grid-template-columns 1fr 1fr, gap 20px
.research-full: grid-column 1 / -1
.research-card: border 1px solid var(--border), border-radius 12px, padding 24px
.research-badge: DM Sans 11px, uppercase, letter-spacing 0.08em, font-weight bold, display inline-block, padding 4px 10px, border-radius 12px, margin-bottom 12px
  .research-badge-blue: background var(--lt-blue), color var(--dk-blue)
  .research-badge-green: background var(--lt-green), color var(--dk-green)
  .research-badge-amber: background var(--lt-amber), color var(--dk-amber)
  .research-badge-muted: background var(--bg-secondary), color var(--text-muted)
.research-list: list-style none, padding 0, DM Sans 14px, line-height 2
.research-refs: DM Sans 13px, color var(--text-secondary), line-height 1.8
.research-live-grid: display grid, grid-template-columns repeat(3,1fr), gap 12px, margin-top 12px
.research-live-tile: text-align center, padding 12px, background var(--bg-secondary), border-radius 8px
  span: Playfair Display 28px, bold, color var(--dk-blue), display block
  label: DM Sans 11px, color var(--text-muted), text-transform uppercase
.research-close, .research-print: fixed top-right, DM Sans 13px buttons, gap 8px
```

---

# ═══════════════════════════════════════
# PROMPT 12 — Final Polish Pass: Micro-Interactions & Delight
# ═══════════════════════════════════════

**Files to edit:** `style.css` and any JS file
**What this does:** Adds the final layer of delight — the details that separate good from extraordinary.

```
Perform a final polish pass on AdaptiveStudy. These are small but impactful additions:

CSS ADDITIONS (add to style.css):

1. SIDEBAR TOPIC PILL ACTIVE STATE
.topic-pill.active::before: a small animated dot that pulses to the left of the text
@keyframes pillDot: scale 1→1.3→1, 2s loop

2. BOTTOM STATUS BAR PULSE DOT
.status-dot: 8px circle, background var(--accent-green), display inline-block, border-radius 50%, margin-right 6px
@keyframes statusPulse: box-shadow 0→0 0 6px rgba(107,175,122,0.4)→0, 2s infinite

3. SESSION TIMER STYLING
#session-timer: Playfair Display 28px, color var(--text-primary), tabular-nums
At 25min mark (when Pomodoro triggers): add class .timer-warning → color shifts to var(--accent-amber), pulse gently

4. SMOOTH SCROLL FOR THE WHOLE PAGE
html: scroll-behavior smooth

5. FOCUS RING FOR ACCESSIBILITY
All focusable elements: outline 2px solid var(--accent-blue), outline-offset 2px (on :focus-visible only)

6. BUTTON PRESS FEEDBACK
All .btn, button: active state → transform scale(0.97), transition 0.1s

7. TOPIC PILL COUNT BADGE
Each .topic-pill can have a .pill-count span: DM Sans 10px, background var(--bg-secondary), 
border-radius 8px, padding 1px 6px, margin-left 4px, color var(--text-muted)
This shows how many cards per subject are in the current deck

8. RIGHT PANEL COLLAPSE ANIMATION
When right panel collapses (class .panel-hidden): use clip-path: inset(0 100% 0 0) instead of just translateX
This creates a wipe effect rather than a slide

9. SKELETON LOADING STATES
While calibrating, show skeleton placeholders for the 4 metric bars:
.skeleton: background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%)
background-size: 200% 100%
@keyframes shimmer: background-position 200%→-200%, 1.5s infinite

10. NAVBAR SCROLL SHADOW
On scroll: add subtle box-shadow to navbar using CSS only via sticky + scroll-driven (or JS class toggle)
.navbar.scrolled: box-shadow 0 2px 20px rgba(0,0,0,0.08)

JS ADDITIONS (add to dashboard.js):

1. Navbar scroll shadow:
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});

2. Topic pill count badges:
After content is ready, update each .topic-pill's .pill-count with the number of cards for that subject.

3. Pomodoro timer class:
After the existing Pomodoro toast, add class .timer-warning to #session-timer.
```

---

# ═══════════════════════════════════════
# PROMPT 13 — Verification & Bug-Fix Prompt
# ═══════════════════════════════════════

**Use after running all previous prompts.**
**What this does:** Systematic verification checklist to confirm everything works before submission.

```
Perform a complete code audit and bug-fix pass on AdaptiveStudy.

Check and fix the following:

1. SCRIPT LOAD ORDER
Confirm in index.html that scripts load in exactly this order:
cognitive-engine.js → study-content.js → ui-adapter.js → analytics.js → onboarding.js → dashboard.js
If any file is missing from the script tags, add it.

2. ID CONSISTENCY
Verify that every ID referenced in JS exists in the HTML:
- #cursor-dot, #cursor-ring, #state-wash
- #calibration-bar, #confidence-indicator
- #stat-cards-seen, #stat-cards-learned, #stat-calm-time, #stat-avg-load
- #btn-export-report, #btn-shortcuts, #btn-tour, #btn-close-shortcuts, #btn-close-research
- #shortcut-modal, #research-overlay, #onboarding-overlay
- #tour-spotlight, #tour-tooltip, #tour-title, #tour-body, #tour-step-badge, #tour-dots
- #btn-tour-next, #btn-tour-prev
- #research-avg-score, #research-peak-score, #research-calm-pct, #research-switches, #research-cards-done, #research-session-time
- #card-subject, #card-difficulty, #card-counter, #confidence-row
- #mastery-bar-list, #mastery-section
- #session-timer
- #sparkline-canvas

For any ID that exists in JS but not HTML: add a stub element to index.html.
For any ID that exists in HTML but no corresponding JS code: add a comment noting it's future-use.

3. NULL GUARDS
In every JS file, add optional chaining or null checks before any querySelector result is used:
- document.getElementById('foo')?.addEventListener(...)
- if (!el) return; before any el.style.xxx or el.textContent

4. CSS VARIABLE COMPLETENESS
In :root in style.css, verify these variables are defined:
--lt-green, --dk-green, --lt-amber, --dk-amber, --lt-coral, --dk-coral, --lt-blue, --dk-blue, --dark-blue
If any are missing, add them with appropriate values:
--lt-green: #EAF4ED
--dk-green: #4A8A59
--lt-amber: #FBF0E3
--dk-amber: #C07A2F
--lt-coral: #FAEAEA
--dk-coral: #B84B4B
--lt-blue: #E8F2F7
--dk-blue: #4A7B95
--dark-blue: #3A6B85

5. DEMO MODE CONFLICT
Ensure Demo Mode does not conflict with the calibration phase:
- If calibration is still running when Demo is activated, skip to calibration complete state instantly
- engine.setDemoMode(true) should also call calibration-complete path if not already calibrated

6. LOCALSTORAGE KEYS
All localStorage keys should use the prefix 'adaptivestudy-':
- 'adaptivestudy-notes'
- 'adaptivestudy-tour-complete'
Verify these are consistent across all files.

7. MOBILE TOUCH EVENTS
The cursor-dot JS should only run if NOT on a touch device:
if (!window.matchMedia('(hover: none)').matches) { // init cursor }

8. PRINT STYLESHEET
Verify @media print rules in style.css include:
- #cursor-dot, #cursor-ring, .bg-mesh, #state-wash, #shortcut-modal, #onboarding-overlay: display none !important
- #research-overlay (when visible): display block, position static, overflow visible

After all fixes: write a summary of every change made and which file it was in.
```

---

# ═══════════════════════════════════════
# PROMPT 14 — Demo Script Polish
# ═══════════════════════════════════════

**File to edit:** `js/dashboard.js` (Demo Mode section only)
**What this does:** Makes Demo Mode more dramatic and presentation-perfect.

```
Upgrade the Demo Mode implementation in dashboard.js.

Current Demo Mode:
- 0-5s: score rises 20→45
- 5-10s: score rises 45→78
- 10-15s: score drops 78→30

Upgrade to:
1. Use a smoother interpolation — easeInOut curve instead of linear steps
   Use: easedValue = start + (end - start) * (t < 0.5 ? 2*t*t : -1+(4-2*t)*t)

2. Extended timeline: 20 seconds total
   - 0-3s: stay at 20 (normal Focus Mode — "see the full interface")
   - 3-8s: rise to 48 (medium — "watch bars climb")
   - 8-13s: rise to 82 (high — "Calm Mode triggers")
   - 13-17s: hold at 82 ("notice: hard cards are gone, layout simplified")
   - 17-20s: drop to 25 ("recovery — Focus Mode returns")

3. Console commentary: During demo, log phase descriptions:
   console.log('[Demo] Phase 1: Baseline — normal interaction');
   console.log('[Demo] Phase 2: Load rising — sensors detecting stress signals');
   console.log('[Demo] Phase 3: Overload — Calm Mode activating...');
   console.log('[Demo] Phase 4: Sustained overload — interface fully simplified');
   console.log('[Demo] Phase 5: Recovery — restoring full interface');

4. Demo Phase Toast Notifications:
   At each phase transition, show a toast describing what's happening:
   Phase 2: showToast("📈 Load rising — try typing or moving quickly", "info")
   Phase 3: showToast("🌿 Overload detected — entering Calm Mode", "calm")
   Phase 5: showToast("↩ Recovering — restoring Focus Mode", "success")

5. Demo Mode Indicator Badge:
   When demo is active, add a blinking DEMO badge in the navbar
   Remove it when demo ends
   Badge style: red pill, DM Sans 10px uppercase, animation blink 1s step-end infinite

6. After demo completes:
   showToast("✓ Demo complete — try interacting normally now!", "success")
   engine.setNoiseLevel(2) — restore natural noise
   analytics.logEvent('demo_mode_end', { duration: 20000 })
```

---

# ═══════════════════════════════════════
# PROMPT 15 — Final Commit Message & GitHub Polish
# ═══════════════════════════════════════

**Not a code prompt — use in terminal.**
**What this does:** Commits everything cleanly with a professional commit message.

```bash
cd /Users/lakshitsachdeva/Desktop/Projects/hci-proj

# Stage everything
git add -A

# Professional commit message
git commit -m "feat: complete AdaptiveStudy upgrade — v2.0

- Add calibration phase (15s baseline) to CognitiveEngine
- Add signal confidence scoring and session statistics
- Add SessionAnalytics module with exportable session report
- Add OnboardingTour with 6-step guided interface walkthrough
- Add Research Overlay (Ctrl+R) with live session metrics
- Add Keyboard Shortcut Modal (press ?)
- Add confidence rating system on flashcard back face
- Add simplified spaced repetition scheduler (SM-2 inspired)
- Add per-card and per-subject analytics tracking
- Add animated number counters throughout UI
- Add custom cursor with liquid follow behavior
- Add card tilt effect with mouse-position perspective
- Add mode transition wave ripple animation
- Add metric bar pulse animation above threshold 70
- Add stat tiles panel in right monitoring section
- Add mastery bars per subject in sidebar
- Add skeleton loading states during calibration
- Add export session report (opens in new window)
- Upgrade Demo Mode: 20s timeline, phase toasts, console commentary
- Add complete ARIA semantic accessibility layer
- Add print stylesheet for Research Overlay
- Add README.md with full documentation

Zero external dependencies. Pure HTML/CSS/Vanilla JS."

# Push
git push origin main
```

---

---

## 🏆 WHAT YOU END UP WITH

After running all 15 prompts, AdaptiveStudy will have:

### Academic Strength
- Every HCI principle explicitly demonstrated, labeled, and linked to code
- A real-time academic poster overlay with live session data (Ctrl+R)
- Exportable session report as a styled HTML document
- Properly cited methodology visible in the Research Overlay

### Technical Depth
- Calibration phase — shows understanding of per-user baseline
- Confidence scoring — shows understanding of signal reliability
- SM-2-inspired spaced repetition — shows HCI + learning science integration
- Per-card analytics — shows data-driven thinking
- Session event log — shows systems thinking

### Visual Excellence
- Animated gradient mesh background — alive, not static
- Custom cursor with liquid follow — crafted feel
- Card perspective tilt on hover — premium interaction
- Mode transition wave ripple — cinematic quality
- Animated number counters — data feels live
- Skeleton loading states — professional polish
- Spring-bounce toast notifications — delightful feedback

### Presentation Readiness
- Onboarding tour auto-starts on first visit
- Demo Mode: 20-second scripted arc with phase toasts
- Keyboard shortcut guide (press ?)
- Research Overlay ready for academic audience
- Export button for leave-behind artefact

### Accessibility & Professionalism
- Full ARIA semantic layer
- Focus ring visibility
- Touch device cursor exclusion
- Print stylesheet
- Professional README on GitHub

---

## ⏱ ESTIMATED TIME

| Task | Time |
|------|------|
| Run Prompts 1–9 (main code) | 2–3 hours |
| Verification Pass (Prompt 13) | 30 min |
| Demo Mode Polish (Prompt 14) | 20 min |
| Git commit + push | 5 min |
| Manual browser test | 30 min |
| **Total** | **~4 hours** |

---

## 🎯 WHAT TO SAY IN YOUR PRESENTATION

> "AdaptiveStudy is not just a study tool — it is an interface that listens. Using four behavioral signals sampled 120 times per minute, it computes a live measure of your cognitive state and reshapes itself around you — hiding complexity when you're overwhelmed, restoring it when you recover. Every design decision, from the warm ivory palette to the breathing animation in Calm Mode, is a deliberate application of HCI principles grounded in Sweller's Cognitive Load Theory."

That's your opening. Everything else is demo.

---

*Blueprint version: 2.0 | Last updated: April 2026 | For: AdaptiveStudy HCI Submission*
