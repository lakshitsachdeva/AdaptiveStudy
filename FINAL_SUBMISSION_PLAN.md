# AdaptiveStudy Final Submission Plan

Last updated: 2026-04-06  
Project folder: `/Users/lakshitsachdeva/Desktop/Projects/hci-proj`  
GitHub repo: `https://github.com/lakshitsachdeva/AdaptiveStudy`

## 1. Current State Summary

AdaptiveStudy is currently a working front-end prototype built with:

- `HTML`
- `CSS`
- `Vanilla JavaScript`
- `localStorage` for notes persistence
- `SVG` for the mental load gauge, progress rings, and sparkline

There is no backend, no database, no authentication, and no build step.

The app is already pushed to GitHub and the local repo is clean.

Current git state:

- Branch: `main`
- Latest commit: `0b45b10`
- Commit message: `Initial AdaptiveStudy prototype`

## 2. What Has Already Been Completed

### A. Core app structure

The following files already exist and are wired together:

- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/index.html`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/style.css`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/cognitive-engine.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/ui-adapter.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/study-content.js`
- `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/dashboard.js`

### B. UI layout is implemented

The interface already includes:

- Fixed top navbar
- Left sidebar
- Main content area
- Right monitoring panel
- Bottom status bar

### C. Visual design is implemented

The design language already follows the intended "Calm Minimal" direction:

- warm ivory and parchment backgrounds
- white editorial cards
- Playfair Display for headings
- DM Sans for body text
- smooth transitions and soft shadows
- flashcard flip animation
- page-load animations
- grain/noise overlay
- calm-mode breathing animation
- responsive mobile behavior

### D. Cognitive sensing engine is implemented

The app already computes a live cognitive-load estimate from 4 signals:

1. Cursor Entropy
2. Hesitation Index
3. Error Rate
4. Scroll Rhythm

These are combined into a smoothed composite Mental Load Score from `0-100`.

### E. Live UI adaptation is implemented

The UI already:

- updates the right-panel bars in real time
- updates the navbar circular gauge
- updates state text in the bottom bar
- switches between Focus Mode and Calm Mode
- shows toast notifications
- draws a sparkline history graph

### F. Flashcard learning system is implemented

The prototype already includes:

- a deck of `20` flashcards
- `5` subjects
- `4` cards per subject
- difficulty levels: `easy`, `medium`, `hard`
- card flip behavior
- next card behavior
- mark learned
- review later
- subject filtering
- progress ring updates
- load-based difficulty filtering

### G. Demo functionality is implemented

A demo mode button already exists in the navbar.

It simulates a controlled cognitive-load curve:

- `0-5s`: score rises from `20` to `45`
- `5-10s`: score rises to `78`
- `10-15s`: score drops to `30`

This is useful for presentation because it guarantees that Calm Mode and Focus Mode transitions can be shown even if real user behavior does not trigger them during the demo.

## 3. Exactly What Each File Does

## `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/index.html`

This is the full semantic app shell.

It contains:

- the top navbar with:
  - AdaptiveStudy logo
  - Mental Load gauge
  - mode badge
  - demo mode button
- the left sidebar with:
  - Today's Topics pills
  - Progress rings
  - Session Timer
- the main content area with:
  - Active Study Block card
  - Flashcard front and back
  - Study Notes textarea
  - action buttons
- the right panel with:
  - 4 live cognitive metric rows
  - load history sparkline container
- the bottom status bar
- the inline SVG noise filter definition used for grain texture

It also links all JS modules and `style.css`.

## `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/style.css`

This controls the full visual system.

Already implemented in CSS:

- root color palette variables
- typography system
- app layout grid
- navbar styling
- sidebar and right panel transitions
- card styling
- flashcard 3D flip animation
- study notes styling
- metric bars styling
- toast styling
- progress ring styling
- page-load motion
- calm-mode transformations
- breathing effect for the main card
- custom scrollbar
- responsive behavior under `900px`
- grain/noise overlay

## `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/cognitive-engine.js`

This is the sensor and scoring layer.

It:

- starts listeners on `document`
- samples mouse movement
- tracks click and keyboard timing
- tracks delete/backspace behavior
- tracks scroll speed and direction changes
- computes 4 normalized metrics:
  - `cursorEntropy`
  - `hesitationIndex`
  - `errorRate`
  - `scrollRhythm`
- computes a weighted composite score:
  - Cursor Entropy `25%`
  - Hesitation Index `35%`
  - Error Rate `25%`
  - Scroll Rhythm `15%`
- smooths the score using exponential moving average
- exposes:
  - `getMentalLoadScore()`
  - `getLoadState()`
  - `getMetrics()`
  - `startPolling()`
  - `stopPolling()`

Important note:

This is heuristic sensing, not validated cognitive science instrumentation. It is suitable for a prototype/demo and should be described that way in the report.

## `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/ui-adapter.js`

This module translates metrics into interface changes.

It:

- updates bar widths and values
- changes bar colors by threshold
- updates the circular load gauge
- interpolates gauge color from green to amber to coral
- updates bottom status text
- updates session quality text
- debounces mode transitions
- activates Calm Mode on repeated high-load readings
- restores Focus Mode when load comes down
- shows toast notifications
- renders the sparkline SVG line

## `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/study-content.js`

This module manages all study content.

It:

- defines the `20` flashcards
- shuffles the deck
- renders the current card
- flips the card
- moves to the next card
- tracks learned cards
- tracks review-later cards
- updates the progress rings by subject
- returns subject progress ratios
- filters the deck based on current load state
- filters the deck by selected subject

Load adaptation behavior:

- `low` load: show `easy + medium + hard`
- `medium` load: show `easy + medium`
- `high` load: show `easy only`

## `/Users/lakshitsachdeva/Desktop/Projects/hci-proj/js/dashboard.js`

This is the orchestration layer.

It:

- initializes all modules on `DOMContentLoaded`
- starts the session timer
- updates the timer every second
- suggests a Pomodoro break after `25` minutes
- starts cognitive polling every `500ms`
- sends metrics to the UI adapter
- sends load state to the study content manager
- stores the last `30` composite scores
- wires all buttons
- wires topic pill clicks
- restores notes from `localStorage`
- autosaves notes on input
- adds keyboard shortcuts
- runs Demo Mode
- exposes a small global dashboard object

## 4. Features That Are Demo-Ready Right Now

These parts should already work in a browser:

- page layout and styling
- navbar gauge updates
- real-time metric bars
- flashcard flip
- next/learn/review/skip actions
- topic pill subject filtering
- progress ring updates
- notes autosave and restore
- session timer
- Pomodoro toast after long use
- Focus Mode and Calm Mode transitions
- load history sparkline
- responsive sidebar/right-panel toggles
- Demo Mode scripted adaptation

## 5. Likely Weak Spots / Risks Before Final Submission

These are the main things to be aware of:

### A. It is a front-end prototype, not a production system

This is fine for an HCI/demo submission, but the report should clearly say:

- it is a proof-of-concept
- adaptation is rule-based and heuristic
- no backend or user profile system is included

### B. Real cognitive detection is simulated/inferred

The engine estimates load indirectly through interaction patterns.

This means:

- results are plausible, not medically reliable
- load readings may vary by browser behavior and demo style
- Demo Mode is the most reliable presentation path

### C. Browser-only validation may still be needed

The code has been built and structured, but final demo confidence should come from manually opening it in the browser and checking:

- layout
- animations
- panel toggles
- toast timing
- sparkline rendering
- keyboard shortcuts
- progress updates
- demo mode transitions

### D. No README yet

There is currently no documented setup file in the repo.  
If you want a cleaner final submission, adding a short `README.md` would help.

## 6. What You Should Do Before Tomorrow

## Priority 1: Run and visually verify the app

Run from the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Check these manually:

- app loads without console errors
- all scripts load
- gauge updates in navbar
- bars move in right panel
- demo mode works
- flashcard flips
- learned/review/skip work
- notes save after refresh
- topic buttons filter cards
- mobile layout works below `900px`

## Priority 2: Take screenshots for the report

Take these screenshots:

1. Full dashboard in normal Focus Mode
2. Dashboard in Calm Mode
3. Right panel showing live metrics
4. Flashcard front
5. Flashcard back
6. Demo Mode active with `DEMO` badge
7. Mobile/responsive view

## Priority 3: Write the report

Your report should include:

1. Title
2. Abstract
3. Problem statement
4. Objectives
5. System architecture
6. Cognitive load detection logic
7. UI adaptation logic
8. Flashcard/content logic
9. Visual design rationale
10. Demo flow
11. Limitations
12. Future work
13. Conclusion

## Priority 4: Prepare your presentation/demo script

Recommended flow:

1. Start with the normal dashboard view
2. Explain the four cognitive metrics
3. Show a flashcard flip and notes typing
4. Turn on Demo Mode
5. Point out the score rising
6. Show Calm Mode activating
7. Explain that hard cards are hidden under high load
8. Show the score coming down again
9. Show Focus Mode returning
10. End with the value proposition: adaptive studying with reduced overload

## 7. Suggested Final Submission Package

If your faculty only wants the project files, this folder is already the core package.

If they want a polished submission, you should ideally include:

- source code
- report PDF
- screenshot set
- README
- optionally a short demo video

## 8. Exact Color Palette Used

Use these exact colors in the report if you want the writing or visuals to match the app:

- Warm ivory background: `#FAF8F3`
- Parchment secondary: `#F2EFE7`
- White cards: `#FFFFFF`
- Sidebar background: `#F5F3EC`
- Primary text: `#2C2C2C`
- Secondary text: `#7A7670`
- Muted text: `#B0ADA6`
- Calm green: `#6BAF7A`
- Medium amber: `#E09A4F`
- High-load coral: `#D96B6B`
- Interactive blue: `#6A9BB5`
- Border: `#E8E4DC`

Typography:

- Headings: `Playfair Display`
- Body: `DM Sans`

Design style keywords:

- Calm Minimal
- editorial
- premium digital notebook
- warm
- soothing
- adaptive

## 9. Suggested Report Positioning

The safest and strongest way to describe this project is:

`AdaptiveStudy is an interactive front-end prototype that explores how cognitive-load-aware interfaces can adapt study environments in real time using behavioral interaction signals.`

That wording is good because it is:

- accurate
- honest
- strong enough for an HCI submission
- not overclaiming scientific validity

## 10. Suggested Final To-Do Checklist

Use this checklist tonight or tomorrow morning:

- Open the app locally and test everything once
- Open browser console and confirm no major errors
- Capture screenshots
- Write or generate the report
- Add a short `README.md`
- If needed, make one final polish commit
- Re-push to GitHub
- Zip the project if your college requires a zip submission

## 11. If You Need To Explain The Project In One Short Paragraph

AdaptiveStudy is a cognitive-load-aware study dashboard built as a static web prototype using HTML, CSS, and vanilla JavaScript. It monitors interaction signals such as cursor entropy, hesitation, error rate, and scroll rhythm, combines them into a live mental load score, and adapts the interface in real time by shifting between Focus Mode and Calm Mode, simplifying content difficulty, and presenting live cognitive feedback through gauges, progress rings, flashcards, notes, and a session dashboard.

## 12. Most Important Message For Tomorrow

You do not need to present this as a perfect production system.

Present it as:

- a thoughtful HCI prototype
- a working proof of concept
- a demonstration of adaptive interface logic
- a design exploration of cognitive-load-aware learning

That is already a strong final submission position.
