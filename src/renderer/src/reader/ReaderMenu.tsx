// Discreet in-reader menu: text-size control + table of contents. Opened by the
// 'c' key or the hover button; closes on backdrop click or after a chapter jump.
// Styled as a neutral navigator so it doesn't break the disguise for long.

import type { OpenedBook } from '../../../shared/types'

export default function ReaderMenu({
  book,
  currentIndex,
  progress,
  fontScale,
  onJump,
  onSetFontScale,
  onLookup,
  onClose
}: {
  book: OpenedBook
  currentIndex: number
  progress: number
  fontScale: number
  onJump: (i: number) => void
  onSetFontScale: (v: number) => void
  onLookup: () => void
  onClose: () => void
}): React.JSX.Element {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80%] w-[440px] flex-col overflow-hidden rounded-xl border border-[#2b3650] bg-[#0d1117] text-[#c8ccd4] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[#1b2230] px-4 py-3">
          <div className="truncate text-sm font-semibold text-[#e6edf3]">{book.meta.title}</div>
          <div className="mt-0.5 text-xs text-[#5c6370]">
            Chapter {currentIndex + 1} of {book.chapters.length} · {Math.round(progress * 100)}%
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#161b22]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-soft"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Text size */}
        <div className="flex items-center gap-3 border-b border-[#1b2230] px-4 py-3">
          <span className="text-xs uppercase tracking-wider text-[#5c6370]">Text size</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => onSetFontScale(fontScale - 0.1)}
              className="grid h-7 w-7 place-items-center rounded border border-[#2b3650] text-sm text-[#c8ccd4] hover:border-brand/60"
            >
              A−
            </button>
            <span className="w-12 text-center text-xs tabular-nums text-[#7d8694]">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              onClick={() => onSetFontScale(fontScale + 0.1)}
              className="grid h-7 w-7 place-items-center rounded border border-[#2b3650] text-base text-[#c8ccd4] hover:border-brand/60"
            >
              A+
            </button>
          </div>
        </div>

        {/* Dictionary */}
        <div className="flex items-center gap-3 border-b border-[#1b2230] px-4 py-3">
          <span className="text-xs uppercase tracking-wider text-[#5c6370]">Dictionary</span>
          <button
            onClick={onLookup}
            className="ml-auto rounded border border-[#2b3650] px-2.5 py-1 text-xs text-[#c8ccd4] hover:border-brand/60 hover:text-brand"
          >
            Look up a word (d)
          </button>
        </div>

        {/* Table of contents */}
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {book.chapters.map((c, i) => {
            const state = i < currentIndex ? 'read' : i === currentIndex ? 'current' : 'ahead'
            return (
              <button
                key={i}
                onClick={() => {
                  onJump(i)
                  onClose()
                }}
                className={`flex w-full items-center gap-3 px-4 py-1.5 text-left text-[13px] transition-colors hover:bg-[#161b22] ${
                  state === 'current' ? 'bg-[#11202e]' : ''
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-right text-[11px] tabular-nums ${
                    state === 'current' ? 'text-brand' : 'text-[#3b4252]'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate ${
                    state === 'current'
                      ? 'font-medium text-[#e6edf3]'
                      : state === 'read'
                        ? 'text-[#5c6370]'
                        : 'text-[#a3acba]'
                  }`}
                >
                  {c.title}
                </span>
                {state === 'read' && <span className="text-[10px] text-[#3b4252]">read</span>}
                {state === 'current' && <span className="text-[10px] text-brand">●</span>}
              </button>
            )
          })}
        </div>

        <div className="border-t border-[#1b2230] px-4 py-2 text-[10px] text-[#3b4252]">
          press c to toggle · d to look up · backspace to exit · esc to hide
        </div>
      </div>
    </div>
  )
}
