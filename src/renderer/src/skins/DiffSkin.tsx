// Code-review / git-diff skin: a pull request open for review. Book text hides
// as added (+) lines in the diff; context/removed lines and a hunk header fill
// short pages. Files sidebar, CI checks and review chrome sell the disguise.

import { useEffect, useMemo, useRef } from 'react'
import {
  BOOK_INK,
  MONO_FONT,
  MonoProbe,
  fixCols,
  hashStr,
  slugify,
  useMonoMeasure,
  useTicker
} from './common'
import type { SkinProps } from './types'

const FONT_SIZE = 13
const LINE_H = 22
const PREFIX_COLS = 9

const CONTEXT = [
  'def configure(self, opts: Options) -> None:',
  '    self._opts = opts',
  '    self._registry = Registry(opts.namespace)',
  '    return self._registry.bind()',
  'for handler in self._pipeline:',
  '    handler.attach(self._registry)',
  'logger.debug("registry bound: %s", self._registry)',
  'if not self._ready:',
  '    raise StateError("configure() before run()")'
]

export default function DiffSkin(props: SkinProps): React.JSX.Element {
  const { book, lines, chapterIndex, progress, onGeometry } = props
  const areaRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const { cols, rows } = useMonoMeasure(areaRef, probeRef, LINE_H)

  const columns = Math.max(24, cols - PREFIX_COLS - 1)
  const bookRows = rows
  useEffect(() => {
    onGeometry({ columns, rows: bookRows })
  }, [columns, bookRows, onGeometry])

  const tick = useTicker(1000)
  const slug = useMemo(() => slugify(book.meta.title), [book.meta.title])
  const seed = useMemo(() => hashStr(book.meta.title) + chapterIndex * 31, [book, chapterIndex])

  type Row = { kind: 'add' | 'ctx' | 'del' | 'hunk'; no: string; text: string; book?: boolean }
  const rendered = useMemo<Row[]>(() => {
    const out: Row[] = []
    const base = 120 + chapterIndex * 40
    let n = base
    out.push({ kind: 'hunk', no: '', text: `@@ -${base},7 +${base},${bookRows + 9} @@ class ${slug}` })
    lines.forEach((line) => {
      if (line.trim() === '') {
        out.push({ kind: 'add', no: fixCols(`${n++}`, 5), text: '', book: false })
      } else {
        out.push({ kind: 'add', no: fixCols(`${n++}`, 5), text: line, book: true })
      }
    })
    for (let i = lines.length; i < bookRows; i++) {
      const r = (seed + i) % 7
      if (r === 0) out.push({ kind: 'del', no: fixCols('', 5), text: CONTEXT[(seed + i) % CONTEXT.length] })
      else out.push({ kind: 'ctx', no: fixCols(`${n++}`, 5), text: CONTEXT[(seed + i) % CONTEXT.length] })
    }
    return out
  }, [lines, bookRows, seed, slug, chapterIndex])

  const files = [
    { f: `core/${slug}.py`, a: 142, d: 12, active: true },
    { f: `core/registry.py`, a: 28, d: 4 },
    { f: `tests/test_${slug}.py`, a: 96, d: 0 },
    { f: `docs/${slug}.md`, a: 34, d: 7 }
  ]

  return (
    <div className="flex h-full w-full flex-col bg-[#0d1117] text-[#c8ccd4]">
      {/* PR header */}
      <div className="border-b border-[#1b2230] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#238636] px-2 py-0.5 text-[11px] font-semibold text-white">
            ⌥ Open
          </span>
          <span className="text-sm font-semibold text-[#e6edf3]">
            Refactor {book.meta.title} pipeline into staged handlers
          </span>
          <span className="text-xs text-[#5c6370]">#{1400 + chapterIndex}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-[#5c6370]">
          <span>
            <span className="rounded bg-[#161b22] px-1.5 py-0.5 text-[#7d8694]">feature/{slug}</span>
            {' → '}
            <span className="rounded bg-[#161b22] px-1.5 py-0.5 text-[#7d8694]">main</span>
          </span>
          <span className="flex items-center gap-1 text-[#e5c07b]">
            <span className="h-3 w-3 animate-spin rounded-full border border-[#e5c07b] border-t-transparent" />
            {2 + (tick % 2)} checks running
          </span>
          <span className="text-[#a9c585]">✓ 14 passed</span>
          <span className="ml-auto flex -space-x-1">
            {['#e06c75', '#61afef', '#a9c585'].map((c) => (
              <span key={c} className="h-5 w-5 rounded-full border border-[#0d1117]" style={{ background: c }} />
            ))}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Files changed */}
        <div className="w-56 shrink-0 border-r border-[#1b2230] bg-[#0a0e14] p-2 text-xs">
          <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-[#5c6370]">
            Files changed · {files.length}
          </div>
          {files.map((f) => (
            <div
              key={f.f}
              className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                f.active ? 'bg-[#161b22] text-[#e6edf3]' : 'text-[#7d8694]'
              }`}
            >
              <span className="truncate">{f.f}</span>
              <span className="ml-auto shrink-0 text-[10px]">
                <span className="text-[#3fb950]">+{f.a}</span>{' '}
                <span className="text-[#e06c75]">−{f.d}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Diff — reading surface */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-[#1b2230] bg-[#0a0e14] px-3 py-1.5 text-xs text-[#7d8694]">
            <span className="text-[#e6edf3]">core/{slug}.py</span>
            <span className="text-[#3fb950]">+142</span>
            <span className="text-[#e06c75]">−12</span>
            <span className="ml-auto text-[#5c6370]">Viewed §{chapterIndex + 1}</span>
          </div>
          <div
            ref={areaRef}
            className="relative min-h-0 flex-1 overflow-hidden"
            style={{ fontFamily: MONO_FONT, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
          >
            {rendered.map((r, i) => {
              const bg =
                r.kind === 'add'
                  ? 'bg-[#12261a]'
                  : r.kind === 'del'
                    ? 'bg-[#2d1418]'
                    : r.kind === 'hunk'
                      ? 'bg-[#0e1726]'
                      : ''
              const marker = r.kind === 'add' ? '+' : r.kind === 'del' ? '−' : r.kind === 'hunk' ? '' : ' '
              const textColor =
                r.kind === 'hunk'
                  ? '#56b6c2'
                  : r.book
                    ? BOOK_INK
                    : r.kind === 'add'
                      ? '#7fb37a'
                      : r.kind === 'del'
                        ? '#c98a91'
                        : '#7d8694'
              return (
                <div key={i} className={`flex whitespace-pre ${bg}`} style={{ height: LINE_H }}>
                  <span className="select-none px-2 text-right text-[#3b4252]" style={{ minWidth: 52 }}>
                    {r.no}
                  </span>
                  <span className="select-none pr-2" style={{ color: textColor }}>
                    {marker}
                  </span>
                  <span className="overflow-hidden" style={{ color: textColor }}>
                    {r.text}
                  </span>
                </div>
              )
            })}
            <MonoProbe probeRef={probeRef} fontSize={FONT_SIZE} lineHeight={LINE_H} />
          </div>
          <div className="flex items-center gap-3 border-t border-[#1b2230] bg-[#0a0e14] px-3 py-1.5 text-[11px] text-[#5c6370]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e5c07b]" />
              {3 + (tick % 4)} comments
            </span>
            <span className="rounded border border-[#238636] px-2 py-0.5 text-[#3fb950]">✓ Approve</span>
            <span className="ml-auto tabular-nums">{Math.round(progress * 100)}% reviewed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
