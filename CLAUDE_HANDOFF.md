# AdaptiveStudy Claude Handoff

## Project Snapshot

AdaptiveStudy is a static HTML/CSS/vanilla-JS HCI prototype for a "cognitive load-aware study dashboard."

Core idea:
- infer mental load from passive behavioral signals
- adapt the study UI in real time
- simplify the interface when overload is detected

Main repo files:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/index.html`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/style.css`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/cognitive-engine.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/ui-adapter.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/study-content.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/analytics.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/onboarding.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/chatbot.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/dashboard.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/api/chat.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/vercel.json`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/AdaptiveStudy_MaxMarks_Blueprint.md`

## Current State

### What exists

The app already includes:
- fixed top navbar with logo, mental load gauge, mode badge, demo button, shortcuts, tour, finish session, reset
- left sidebar with topics, progress rings, mastery overview, session timer
- main study area with flashcard, notes, and action buttons
- right insights panel with cognitive load monitor bars, sparkline, session stats, export report, and chatbot
- bottom status bar
- onboarding tour
- research overlay
- end-session overlay with celebratory summary
- PDF/report export via print window
- demo mode
- localStorage persistence for notes, study progress, name, tour state

### What is working conceptually

Architecture is present and reasonably modular:
- `CognitiveEngine` computes metrics and composite score
- `UIAdapter` reflects metrics into the DOM
- `StudyContent` manages flashcards, progress, mastery, filters
- `SessionAnalytics` tracks session data and exports report
- `dashboard.js` wires all modules together

### What is currently broken / inconsistent

The biggest problem right now is that the latest localhost stabilization work intentionally disabled true live cognitive monitoring on localhost.

That means:
- calibration is effectively bypassed on localhost
- real sensor listeners are disabled on localhost
- real live polling is not started on localhost
- instead, localhost shows static fake metrics until Demo Mode is used

This was introduced to stop Chrome from freezing, but it means the core promise of the product is currently compromised in local mode.

### Exact cause of the current calibration / monitoring problem

In `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/cognitive-engine.js`:
- `this.localSafeMode` is set for `localhost`, `127.0.0.1`, or empty hostname
- `startSensorListeners()` returns early when `this.localSafeMode` is true

In `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/dashboard.js`:
- `enableLocalSafeMode()` adds `performance-mode` and `local-safe-mode`
- it force-completes calibration UI
- it hides chat and tour on localhost
- if local, `initializeLocalSafeDashboard()` is used instead of `startRealPolling()`
- `initializeLocalSafeDashboard()` injects static metrics:
  - cursorEntropy: 14
  - hesitationIndex: 18
  - errorRate: 5
  - scrollRhythm: 12
  - composite: 16
  - state: `"low"`

So on localhost the system is not really sensing behavior right now.

## Likely Root Problem Before Safe Mode

The project started freezing / becoming unresponsive in Chrome.

Recent mitigation commits suggest the likely causes were:
- too many repeated UI updates every 500ms
- heavy animations and visual effects
- expensive decorative rendering
- calibration UI / polling interactions making the app feel stuck
- too much work happening during initial load

Recent performance-related commits:
- `54e83e4` fix stuck calibration callback
- `9c4b9f9` add calibration timeout failsafe
- `8252a48` make calibration non-blocking
- `81b5e2c` reduce startup render cost
- `cb35e9d` cut repeated sidebar/stats work
- `fec01ae` add localhost safe mode
- `b7a20ad` harden localhost safe mode

The app was stabilized by sacrificing real local sensing.

## Desired Direction

The system should be reworked so that:
- real cognitive monitoring works again
- calibration works again
- the page does not freeze
- the design looks more polished and consistent
- the component architecture stays modular
- localhost works without disabling the core product behavior

## Functional Architecture

### 1. Cognitive Engine

File:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/cognitive-engine.js`

Responsibilities:
- track cursor entropy
- track hesitation index
- track error rate
- track scroll rhythm
- compute weighted composite score
- smooth final score
- handle calibration
- expose polling API

Sensor weights:
- Cursor Entropy: 25%
- Hesitation Index: 35%
- Error Rate: 25%
- Scroll Rhythm: 15%

Calibration:
- duration: 15000 ms
- plus timeout failsafe

Smoothing:
- exponential moving average
- alpha = 0.3

Current issue:
- localhost safe mode disables listeners and real monitoring

### 2. UI Adapter

File:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/ui-adapter.js`

Responsibilities:
- metric bars
- numeric metric values
- navbar gauge
- gauge color interpolation
- status bar state
- focus/calm mode switching
- toasts
- sparkline
- mastery bars
- session stats
- research overlay stats
- calibration bar

Current issue:
- includes many visual behaviors and some performance-mode branches
- local-safe-mode now disables several animations and some effects

### 3. Study Content

File:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/study-content.js`

Responsibilities:
- owns `FLASHCARD_DECK`
- 20 cards across 5 subjects
- Biology, Physics, History, Math, Literature
- flip card
- next card
- mark learned
- mark review
- progress ring updates
- mastery tracking
- confidence rating
- subject filtering
- difficulty filtering based on load

Load adaptation:
- low: easy + medium + hard
- medium: easy + medium
- high: easy only

Persistence:
- localStorage key: `adaptivestudy-study-state`

### 4. Analytics

File:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/analytics.js`

Responsibilities:
- session event logging
- load sample history
- stats calculation
- report HTML generation
- export via popup print or fallback download

### 5. Onboarding

File:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/onboarding.js`

Responsibilities:
- spotlight-based guided tour
- 6 steps
- localStorage completion state

### 6. Dashboard Orchestrator

File:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/dashboard.js`

Responsibilities:
- app bootstrap on `DOMContentLoaded`
- instantiate engine + UI adapter + study content + analytics + tour
- start timer
- start polling
- wire buttons
- wire notes autosave
- keyboard shortcuts
- demo mode
- end session
- reset state

Current issue:
- contains the localhost bypass logic that currently disables core sensing

### 7. Chatbot

Files:
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/chatbot.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/api/chat.js`

Responsibilities:
- front-end chat UI
- Vercel serverless route for Gemini
- budget protection / anti-spam logic

Gemini protections:
- max 8 requests / 10 min window
- max 3 requests / 60 sec burst
- 12 sec cooldown
- duplicate block for 45 sec
- 600 char prompt limit

Current issue:
- chat is disabled on localhost by design
- only intended to work on Vercel

## UI Structure

### Navbar

Contains:
- logo text
- mental load gauge
- mode badge
- show/hide controls button
- show/hide insights button
- demo mode button
- shortcuts button
- tour button
- finish session button
- reset button
- demo badge

### Left Sidebar

Contains:
- Today’s Topics pills
- Progress cards/rings
- Mastery Overview bars
- Session Timer

### Main Content

Contains:
- Active Study Block card
- flashcard front/back with 3D flip
- confidence buttons on the back
- flip button
- notes textarea
- Mark as Learned / Review Later / Skip buttons

### Right Panel

Contains:
- Cognitive Load Monitor
- 4 metric rows
- confidence indicator
- load history sparkline
- session stats
- export report button
- study assistant chat

### Overlays / Modals

Contains:
- shortcut modal
- welcome/name modal
- session summary overlay
- research overlay
- onboarding overlay
- quick action sheet

## Flashcard Component Details

Current flashcard component:
- wrapper: `.flashcard`
- inner transform layer: `.flashcard-inner`
- front face: `.flashcard-front-face`
- back face: `.flashcard-back-face`
- `is-flipped` class rotates the inner layer
- front uses a warm white surface
- back uses a sage surface
- question is centered and uses serif styling
- answer is simpler and body-text oriented
- confidence buttons appear when flipped

Flashcard state hooks:
- `#flashcard`
- `#flashcard-inner`
- `#flashcard-front`
- `#flashcard-back`
- `#flashcard-question-text`
- `#flashcard-answer-text`
- `#card-subject`
- `#card-difficulty`
- `#card-counter`

## Design System / Style Language

Visual direction:
- calm minimal
- warm editorial
- digital notebook
- premium, soft, academic

Typography:
- headings: Playfair Display
- body: DM Sans
- localhost fallback now uses system fonts when Google Fonts are skipped

CSS variables in `:root`:
- `--bg-primary: #FAF8F3`
- `--bg-secondary: #F2EFE7`
- `--bg-card: #FFFFFF`
- `--bg-sidebar: #F5F3EC`
- `--text-primary: #2C2C2C`
- `--text-secondary: #7A7670`
- `--text-muted: #B0ADA6`
- `--accent-green: #6BAF7A`
- `--accent-amber: #E09A4F`
- `--accent-coral: #D96B6B`
- `--accent-blue: #6A9BB5`
- `--border: #E8E4DC`
- `--shadow-soft: 0 2px 16px rgba(0, 0, 0, 0.06)`
- `--radius: 12px`

Other notable tokens:
- `--navbar-height: 56px`
- `--statusbar-height: 40px`
- `--sidebar-width: 260px`
- `--right-panel-width: 300px`
- `--gauge-circumference: 163.4`

Notable style systems already implemented:
- fixed navbar
- fixed bottom bar
- 3-column desktop shell
- responsive mobile drawer behavior under 900px
- progress rings
- sparkline SVG
- flashcard 3D flip
- calm mode breathing animation
- toasts
- onboarding spotlight
- celebratory session summary overlay

## Localhost-Specific State Right Now

This is the most important part for debugging:

### On localhost currently
- real cognitive monitoring is disabled
- chat is disabled
- tour is hidden
- static fake metrics are shown
- Google Fonts are skipped
- many animations are suppressed

### On deployed Vercel
- chat can work if env vars are configured
- the full app path is closer to intended behavior
- but there may still be unresolved runtime/performance issues

## Exact Things Claude Should Help Fix

Priority 1:
- restore real cognitive monitoring on localhost
- remove the fake static metrics fallback
- preserve performance and avoid browser freezes

Priority 2:
- simplify and refactor startup logic
- isolate expensive effects from critical path
- make calibration reliable and visually honest

Priority 3:
- redesign the UI to be much cleaner and more consistent
- reduce clutter in navbar and panels
- improve spacing, hierarchy, and perceived quality

Priority 4:
- keep the fun presentation features, but make them secondary to the core product

## Suspected Refactor Strategy

Suggested direction for Claude:
- separate the app into "core stable mode" and "enhanced effects"
- make cognitive monitoring independent from decorative UI
- make calibration non-blocking and lightweight
- lazy-init nonessential features:
  - onboarding
  - chatbot
  - research overlay
  - advanced visual effects
- keep the core study dashboard usable with:
  - navbar
  - flashcard
  - notes
  - progress
  - right metric panel
- then layer in enhancements only after stable boot

## Prompt To Send Claude

Use this exact prompt:

```text
I need you to help me reform a static HTML/CSS/vanilla-JS HCI prototype called AdaptiveStudy.

Project path structure:
- index.html
- style.css
- js/cognitive-engine.js
- js/ui-adapter.js
- js/study-content.js
- js/analytics.js
- js/onboarding.js
- js/chatbot.js
- js/dashboard.js
- api/chat.js

Core concept:
AdaptiveStudy is a cognitive load-aware study dashboard. It estimates mental load from four behavioral signals and adapts the interface in real time.

Four sensors and weights:
- Cursor Entropy: 25%
- Hesitation Index: 35%
- Error Rate: 25%
- Scroll Rhythm: 15%
- Composite is smoothed with EMA alpha 0.3

Main UI:
- fixed top navbar with logo, mental load gauge, mode badge, controls, demo, finish session
- left sidebar with topics, progress rings, mastery, timer
- main flashcard study block with notes and actions
- right insights panel with metric bars, sparkline, session stats, export, chatbot
- bottom status bar
- onboarding overlay
- research overlay
- end-session overlay

Important current issue:
The app had performance/freezing problems. To stabilize localhost, the latest code now bypasses the real cognitive engine locally.

Specifically:
- in js/cognitive-engine.js, localSafeMode disables sensor listeners on localhost
- in js/dashboard.js, localhost uses initializeLocalSafeDashboard() instead of startRealPolling()
- localhost shows static fake metrics instead of real live cognitive monitoring
- chat is disabled locally
- tour is hidden locally
- style.css also disables many animations in local-safe-mode

So the app is more stable, but the core feature is currently broken on localhost: calibration and live cognitive load monitoring are not truly happening.

What I need from you:
1. Audit the architecture and propose a clean refactor plan
2. Tell me exactly how to restore real cognitive monitoring without reintroducing freezes
3. Simplify startup so the core dashboard loads fast and reliably
4. Separate critical-path functionality from decorative effects
5. Suggest a better component architecture while staying in vanilla JS
6. Propose UI/UX improvements so the interface looks much more polished, coherent, and premium
7. Suggest what to keep, what to remove, and what to lazy-load
8. If useful, give me replacement code for the boot path and cognitive monitoring flow

Design system currently used:
- Warm ivory background: #FAF8F3
- Parchment secondary: #F2EFE7
- White cards: #FFFFFF
- Sidebar surface: #F5F3EC
- Primary text: #2C2C2C
- Secondary text: #7A7670
- Muted text: #B0ADA6
- Calm green: #6BAF7A
- Medium amber: #E09A4F
- High-load coral: #D96B6B
- Interactive blue: #6A9BB5
- Border: #E8E4DC
- Headings: Playfair Display
- Body: DM Sans

Please structure your response as:
1. Current diagnosis
2. Root-cause hypotheses for freezing
3. Immediate rollback/fix strategy
4. Better architecture proposal
5. UI/UX redesign recommendations
6. Concrete implementation steps
7. Optional code rewrite examples

Assume I want a submission-ready version that actually works, not just a conceptual prototype.
```

## Extra Notes For Claude

If Claude asks what to preserve:
- preserve the project theme and academic premise
- preserve flashcards, notes, progress, end-session summary, and report export
- preserve the four-signal cognitive model concept
- preserve demo mode if possible

If Claude asks what can change:
- navbar density can be reduced
- right panel can be simplified
- research overlay can be deferred or removed from critical path
- tour can be optional
- chat can be optional
- animations can be toned down
- startup sequence can be redesigned completely

## Honest Summary

The repo is not empty or broken beyond repair.
It already has a lot built.
But the latest localhost fix traded away the real cognitive-monitoring behavior to make the browser stop freezing.

So the current state is:
- feature-rich
- visually ambitious
- architecturally promising
- not yet trustworthy in its boot/runtime path
- especially compromised on localhost because real sensing is currently bypassed
