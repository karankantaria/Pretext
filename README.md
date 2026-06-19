<p align="center">
  <img src="icons/png/lockup.png" alt="Pretext — books in disguise" width="420">
</p>

# Pretext

**Books in disguise.** A desktop EPUB reader that dresses your book up as flashy,
busy-looking technical work — so you can read in plain sight. Pick a book, pick a
**camouflage** (an editor, a dashboard, a log stream, a threat map, a Word doc, a
news site…), and read. One key drops an innocuous cover screen if someone walks by.

## Stack
Electron + React + TypeScript (electron-vite), Tailwind, ECharts, Framer Motion.

## Develop
```bash
npm install
npm run dev        # hot-reloading app
npm run build      # typecheck + bundle
npm run build:win  # package the .exe
```
Drop any `.epub` in the project root and it's auto-imported in dev.

## Reader controls
`←/→` or click — turn pages · `c` — contents & text size · `−/=` — text size ·
`Backspace` / hover `←` — exit book · `Esc` or global `F9` — panic cover.

Brand colour `#FF6C7F`. Icon/branding sources live in `icons/`.
