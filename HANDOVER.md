# Covert Reader — Handover & Design Document

> **For the next Claude session:** This document explains what to build: a
> **standalone desktop application** (an `.exe`) that lets you read EPUB books in
> plain sight by dressing them up as impressive-looking technical work, with a
> Spotify player woven in. It evolves an existing Python *terminal* app (in
> `tools/terminal-epub/`, with a sibling music player in
> `tools/terminal-music-player/`). Treat the terminal apps as the reference
> spec for behavior — not as code to port line-for-line. You have full freedom
> on the new stack and UI.

---

## 1. The one-sentence purpose

**An EPUB reader that lets you read books at work in plain sight — by disguising
the book as flashy technical software, with a built-in Spotify player as a
bonus.**

The reading is real. The *camouflage* is the product.

---

## 2. Audience & fidelity bar — READ THIS FIRST

This is the most important framing, and it changed from the terminal version:

**The observer is non-technical.** Nobody the user works with can tell real code
from fake code, a real dashboard from a fake one. The goal is **not** to survive
a developer's scrutiny. The goal is that someone walking past glances at the
screen and thinks *"wow, I wonder what he's working on"* and keeps walking.

So the bar is **"looks impressive and busy and technical,"** not **"is
accurate."** This frees you up enormously:

- It can be **as fancy, animated, and colorful as you like.** Glowing dashboards,
  scrolling world maps, live charts, streaming logs — whatever reads as
  "complicated important work" at a glance.
- It does **not** need to be plausible code, valid SQL, real telemetry, etc.
  Motion, color, density, and confident labels sell it far better than
  correctness ever would.
- The terminal version's old rule *"determinism breeds believability / no
  tells / survive scrutiny"* is **downgraded.** The only remaining tell that
  matters: nothing should obviously read as *a book or a reading app* (no big
  serif paragraphs, no "Chapter 7 of 24" page-turner UI, no cover art on screen).

Optimize for **"impressive spectacle"** first, **"comfortable to actually read"**
second, and drop the obsession with authenticity.

---

## 3. The app layout (the structure to build)

This is the exact flow the user wants. Three screens, in order:

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│ 1. LIBRARY  │ ──▶ │ 2. PICK          │ ──▶ │ 3. READ      │
│  (home)     │pick │   CAMOUFLAGE     │pick │  (disguised) │
│  pick book  │book │   (skin/theme)   │skin │   the book   │
└─────────────┘     └──────────────────┘     └──────────────┘
       ▲                                            │
       └────────────────── back / done ─────────────┘
```

### Screen 1 — Library (home)
The shelf of the user's books. **Core feature: books are sorted into three
shelves** — and this categorization is a first-class feature, not a side effect:

- **Started** — opened, has a saved position (also: continue-reading lives here).
- **To Read** — owned but untouched / queued.
- **Finished** — completed.

A book moves shelves automatically as you read it, and the user should also be
able to move a book manually. "Started" sorts to the top so resuming is one
click. Import = drop in `.epub` files (the terminal version scans an `epubs/`
folder; the app can keep a folder *and/or* an "Add book" picker).

The library screen itself can also wear light camouflage (the terminal version
draws it as a fake "module registry" list), but since this is the home screen
it's fine for it to look like a generic file browser / dashboard list — confirm
with the user how disguised the home screen needs to be.

### Screen 2 — Pick camouflage
After choosing a book, the user picks **which disguise (skin) to read it in**
from a gallery — ideally with a live thumbnail/preview of each. This is the
"wardrobe." See §5 for the full set of skins to offer. The terminal version
also exposes stackable *ambient overlays* (logs / activity / auto-scroll) here;
keep that idea — a skin plus optional motion toggles.

### Screen 3 — Read
The book, rendered inside the chosen camouflage, page by page. **Core feature:
your position is saved automatically** so reopening resumes the exact spot. A
single key/click instantly triggers **panic mode** (see §7).

---

## 4. Core features (non-negotiable)

These must exist regardless of how fancy the skins get:

1. **Three-shelf library** — Started / To Read / Finished, auto-categorized,
   manually overridable, resume-sorted.
2. **Save reading position per book** — resume exactly where you left off.
   Store it as a *fraction* of the chapter (not an absolute line/pixel) so it
   survives window resizes and font changes. Autosave periodically and on exit.
3. **Read the actual EPUB** — parse spine into chapters, strip HTML to clean
   text, paginate to the window.
4. **Pick-camouflage step** between library and reading.
5. **Instant panic / hide** — see §7.
6. **Table of contents / chapter jump.**
7. **(Nice to keep) dictionary lookup** — select/enter a word, show its
   definition (terminal version hits `dictionaryapi.dev`).

---

## 5. The camouflage wardrobe

The skins are the soul of the app. Below: the ones the terminal version already
implements (rebuild these), then a brainstorm of new, flashier ones to add now
that realism isn't required.

**The universal trick:** every skin needs a place to hide a screenful of book
text that reads as "part of the interface." Comments, log lines, chart labels,
table rows, chat messages, tooltips, ticker text — anything that can hold
prose. For each idea below, the "hides text as:" line is the important part.

### 5A. Already built (port these)

| Skin | Looks like | Hides text as |
|------|-----------|---------------|
| **Code / docstring** (default) | A source file open in an editor, syntax-highlighted with line numbers + tab bar + status bar | Book text inside a class docstring |
| **Comments + code** (`--high`) | Same editor, denser | Each line a `# comment`, with filler code between paragraphs |
| **Git diff** (`--diff`) | A pull-request / code review | Book text as added `+` lines under a diff header |
| **Debugger** (`--debug`) | An IDE mid-debug: code left, a VARIABLES / CALL STACK / WATCH / BREAKPOINTS / CONSOLE panel right, blinking cursor | Text in the code area; the panel is pure decoration |

### 5B. New skins to add (flashy, no realism needed)

Ordered roughly easiest → most ambitious. Pick a handful with the user.

1. **Analytics / BI dashboard.** A grid of live tiles: line charts, bar charts,
   gauges, big KPI numbers ticking, sparklines. *Hides text as:* a "recent
   events" / "data table" panel where each row is a line of the book, or as
   chart annotations/tooltips. Reads as "business intelligence."

2. **AI / ML training run.** Loss & accuracy curves descending live, an epoch
   progress bar, "GPU 0: 94% · 71°C", tensor-shape spam, a streaming training
   log. *Hides text as:* log lines (`[epoch 12] ...`) or a "sample outputs"
   panel. Extremely on-trend; looks like serious work.

3. **Server / system log stream (TUI).** A full-screen scrolling log console,
   color-coded INFO/DEBUG/WARN, fake timestamps. *Hides text as:* the human-
   readable part of each log message. (The terminal version already has this as
   a 5-line *overlay* — promote it to a full skin.)

4. **DevOps / CI-CD pipeline.** Build stages with spinners turning into green
   ticks, a streaming build log, a deploy progress bar. *Hides text as:* build
   log output lines.

5. **Security operations center (SOC).** A dark world map with glowing arcs
   pinging between cities, a "threat feed" list, counters. Pure hacker-movie
   spectacle. *Hides text as:* threat-feed event descriptions. Big "wow" factor.

6. **System / resource monitor** (htop / Task Manager / Grafana vibe). Scrolling
   CPU/mem/network graphs, a process table. *Hides text as:* process names /
   command column, or a log pane.

7. **SQL / database console.** A query editor up top, a results grid below.
   *Hides text as:* a `TEXT`/`description` column where each result row holds a
   line of prose, or as `-- comments` in the query.

8. **Trading / finance terminal** (Bloomberg / crypto vibe). Candlestick charts,
   a scrolling ticker tape, an order book, flashing red/green. *Hides text as:*
   the news-ticker crawl and/or a "headlines" panel. Great for finance offices.

9. **Cloud / Kubernetes dashboard.** Pods, nodes, deployments, status dots
   flipping green. *Hides text as:* pod event logs / descriptions.

10. **Map / fleet / logistics tracker.** A map with vehicles/routes moving, an
    ETA/manifest sidebar. *Hides text as:* manifest or status-update rows.

11. **Packet analyzer / network capture** (Wireshark vibe). A packet list with a
    hex/detail pane. *Hides text as:* the "info" column per packet.

12. **Spreadsheet / financial model.** A big grid with formulas in the bar.
    *Hides text as:* cell contents down a column, or cell comments.

> Implementation tip for all of these: build **one shared "reader engine"** that
> turns the current page of book text into a list of strings, and make each skin
> a **presentation layer** that arranges those strings into its own decoration.
> Adding a skin should mean writing a new view, not new reading logic. Animation
> (chart motion, scrolling logs, blinking cursors) should run on a timer
> independent of input so the screen always looks alive.

---

## 6. Spotify player integration

The repo already has a working terminal Spotify player
(`tools/terminal-music-player/`) that controls real Spotify (play/pause, next/
prev, volume, shuffle, like) via the `spotipy` library + OAuth, with a mock mode
for testing. Its terminal disguise renders the now-playing track as a
**"real-time signal analyzer"** — an animated Unicode waveform with fake DSP
stats (sample rate, FFT size, energy, tempo, key), and the track name/artist
hidden as code comments.

Fold music into the new app in **two complementary ways** — confirm scope with
the user:

1. **A persistent now-playing / music-control widget** available *while
   reading*, in any skin, themed to match the current camouflage. Examples: in
   the dashboard skin it's a "stream health" tile; in the log skin it's an audio-
   pipeline log line; in the editor skin it's the signal-analyzer comments. The
   user can play/pause/skip/like without leaving the book. This is the headline
   integration — music + reading at once, both disguised.

2. **A standalone "Signal Analyzer" skin/screen** — the existing waveform
   disguise as one selectable camouflage (and reachable from the home screen),
   for when the user just wants to control music and look busy without a book
   open.

**Reuse from the terminal player:** the Spotify auth + control layer
(`spotify_client.py`), the audio-feature → waveform animation (`waveform.py`),
and the signal-analyzer visual language. **Setup it needs:** a Spotify developer
`CLIENT_ID`/`CLIENT_SECRET` (OAuth, browser login once, token cached);
volume/skip controls require Spotify Premium. See that folder's `HANDOVER.md`
for the exact credential steps and the mock-mode flag for building UI without
credentials.

---

## 7. Panic mode (the escape hatch)

One key/click, from anywhere, **instantly** swaps the whole screen to something
totally innocuous and holds the book's position so a second press returns to the
exact spot. The terminal version shows a scrollable, bland fake source file
(`dispatcher.py`). For the desktop app, raise these options with the user:

- A neutral "cover" screen (a plausible-but-boring document, a generic dashboard,
  or even a real innocuous app-looking screen).
- A **global hotkey** that works even when the window isn't focused.
- A **boss-key** that also minimizes / retitles the window.

Since the audience is non-technical, the panic screen can be simple — it just
must not look like a book.

---

## 8. Ambient motion (sells every skin)

Static screens get noticed ("that hasn't changed in 5 minutes"). The terminal
version offers three stackable, timer-driven effects; carry the idea into every
skin:

- **Live animation** — charts drift, logs scroll, spinners spin, a cursor
  blinks, counters tick. Always-on, independent of the user reading.
- **Idle auto-scroll ("drift")** — after ~45 s with no input, gently advance the
  text ~1 line every few seconds (rolling into the next chapter), so the screen
  keeps moving and the user can read hands-free. Any input resets the timer.

---

## 9. How a page is built (reference pipeline)

1. **Parse EPUB** → walk the spine in reading order, strip HTML (drop
   script/style/nav), collapse whitespace, split into chapters `{title, text}`.
   (Terminal uses `ebooklib` + BeautifulSoup.)
2. **Paginate** the chapter text to the current view size (skin-dependent).
3. **Resolve saved position** (stored as a fraction) → starting page/offset.
4. **Render** the visible slice through the chosen skin, wrap it in that skin's
   decoration + the now-playing widget + panic affordance, paint.

---

## 10. Building the standalone app — guidance

### Must preserve (these *are* the product)
- The three-screen flow: **Library → Pick camouflage → Read.**
- The **three-shelf** library (Started / To Read / Finished) with auto-sort.
- **Resize-proof, fraction-based saved position** per book.
- A **wardrobe of camouflage skins** (port the four built ones, add new flashy
  ones from §5B).
- **Instant, reversible panic.**
- **Ambient motion.**
- The **Spotify player**, woven in per §6.
- A genuinely **readable** reading experience under the costume.

### What a desktop app unlocks
- Real graphics: smooth charts, maps, animations, glow/blur — the "wow" the user
  explicitly wants — instead of terminal repaint.
- Proper window chrome, themes, adjustable text size, selectable text,
  bookmarks/highlights, covers (hidden behind the disguise).
- A **global** panic hotkey and real window disguise.
- Single-file distributable bundling the EPUB parser + Spotify client + assets.

### Open decisions to raise with the user (before committing)
- **Tech stack for the exe.** The big one. Options to weigh: **Electron/Tauri +
  web UI** (best for fancy animated dashboards/charts/maps and the strongest
  "wow" factor — recommended given the flashy goal), vs. **Python GUI +
  PyInstaller** (maximizes reuse of the existing EPUB parsing + Spotify control
  code), vs. native. This choice drives everything else.
- **Which skins** to ship first (pick from §5).
- **How disguised the home screen** itself needs to be.
- **Spotify scope** — widget-while-reading, standalone skin, or both.
- **Panic behavior** — in-window cover vs. global hotkey vs. boss-key.

> Recommendation to surface: given "as fancy as possible" + non-technical
> audience, a **web-tech desktop app (Electron or Tauri)** with a gallery of
> animated dashboard-style skins is the strongest fit. Confirm the user's stack
> preference first.

---

## 11. Reference: existing code

### EPUB reader — `tools/terminal-epub/`
| File | Role |
|------|------|
| `reader.py` | Entry: input loop, key handling, mode/overlay state, library + flag flow, autosave, dictionary, panic toggle. |
| `renderer.py` | All reading renders: default/high/diff/debug pages, TOC, dictionary, log + activity overlays, fake paths/classnames, text wrapping, layout math. |
| `panic.py` | The bland fake `dispatcher.py` + its scrollable renderer. |
| `library.py` | EPUB discovery, shelf tagging (Started/Read/queued), the fake-registry shelf view, and the camouflage picker. |
| `epub_parser.py` | EPUB → `(title, author, chapters[])` via ebooklib + BeautifulSoup. |
| `progress.py` | Fraction-based per-book progress in `~/.epub_cli_progress.json`. |
| `requirements.txt` | `ebooklib`, `beautifulsoup4`, `rich`, `lxml`. |

### Spotify player — `tools/terminal-music-player/`
| File | Role |
|------|------|
| `player.py` | Entry: main loop, input thread, playback controls. |
| `renderer.py` | Signal-analyzer disguise + panic view. |
| `waveform.py` | Animated Unicode spectrum from audio energy. |
| `spotify_client.py` | Real Spotify client (spotipy/OAuth) + mock client for credential-free UI testing. |
| `HANDOVER.md` | **Spotify credential setup + mock-mode instructions — read for integration.** |
| `requirements.txt` | `spotipy`, `rich`, `python-dotenv`. |

Read `renderer.py` / `panic.py` (epub) and `renderer.py` / `spotify_client.py`
(music) first — they hold the exact disguise language and the reusable logic.

---

## 12. Design principles to carry forward

1. **Spectacle over authenticity.** Audience is non-technical: optimize for
   "looks impressive and busy," not "would fool an engineer."
2. **The disguise is the feature** — then make the reading comfortable.
3. **Instant, reversible panic.** One action, exact-position restore.
4. **Always alive.** Animation/motion on a timer so no screen ever looks frozen.
5. **Never lose the user's place.** Resize-proof, autosaving, resumable.
6. **The only tell that matters:** nothing should obviously read as *a book* or
   *a reading app*. Everything else can be as flashy and fake as you want.
