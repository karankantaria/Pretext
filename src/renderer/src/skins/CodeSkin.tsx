// Code / docstring skin (the default). Looks like a Python source file open in
// an editor: tab bar, line-number gutter, syntax colours, status bar. The book
// text lives inside a class docstring. Decoration above/below is fixed chrome;
// only the docstring body scrolls as pages.

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SkinProps } from './types'

const FONT_SIZE = 13
const LINE_H = 21
const GUTTER_PX = 56
const INDENT = 4 // spaces of docstring indent on each book line
const FONT_STACK =
  "'JetBrains Mono','Cascadia Code',ui-monospace,'SF Mono',Menlo,Consolas,monospace"

const KEYWORDS = new Set([
  'from', 'import', 'class', 'def', 'return', 'self', 'None', 'True', 'False',
  'if', 'else', 'elif', 'for', 'in', 'while', 'try', 'except', 'finally', 'with',
  'as', 'raise', 'yield', 'lambda', 'async', 'await', 'not', 'and', 'or', 'is', 'pass'
])

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

function deriveNames(title: string): { className: string; fileName: string; modulePath: string } {
  const words = title.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  const className = (words.map(cap).join('') || 'Document') + 'Engine'
  const slug = words.join('_').toLowerCase() || 'document'
  const fileName = `${slug}.py`
  return { className, fileName, modulePath: `src/core/pipeline/${fileName}` }
}

/** Lightweight One-Dark-ish tokenizer for the decorative (non-book) code lines. */
function pyLine(line: string, keyClass = 'text-[#c8ccd4]'): ReactNode {
  if (line.trim() === '') return ' '
  const hash = line.indexOf('#')
  const code = hash >= 0 ? line.slice(0, hash) : line
  const comment = hash >= 0 ? line.slice(hash) : ''
  const out: ReactNode[] = []
  const re = /("[^"]*"|'[^']*'|\b\d+\b|\b\w+\b|\s+|[^\w\s])/g
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(code))) {
    const t = m[0]
    let cls = keyClass
    if (/^["']/.test(t)) cls = 'text-[#98c379]'
    else if (/^\d+$/.test(t)) cls = 'text-[#d19a66]'
    else if (KEYWORDS.has(t)) cls = 'text-[#c678dd]'
    else if (/^[A-Z]\w*$/.test(t)) cls = 'text-[#e5c07b]'
    out.push(
      <span key={k++} className={cls}>
        {t}
      </span>
    )
  }
  if (comment) out.push(<span key="c" className="text-[#5c6370] italic">{comment}</span>)
  return out
}

interface Row {
  no: number
  node: ReactNode
}

export default function CodeSkin(props: SkinProps): React.JSX.Element {
  const { book, lines, chapterTitle, chapterIndex, progress, onGeometry } = props
  const areaRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const [dims, setDims] = useState({ columns: 80, bookRows: 24 })

  const { className, fileName, modulePath } = useMemo(
    () => deriveNames(book.meta.title),
    [book.meta.title]
  )

  const header = useMemo(
    () => [
      'import logging',
      'from dataclasses import dataclass',
      '',
      'logger = logging.getLogger(__name__)',
      '',
      `class ${className}:`,
      '    """'
    ],
    [className]
  )
  const footer = useMemo(() => ['    """'], [])
  const filler = useMemo(
    () => [
      '',
      '    def __post_init__(self) -> None:',
      '        self._cache: dict[str, float] = {}',
      '        self._ready = True',
      '',
      '    def process(self, payload: bytes) -> Result:',
      '        chunk = self._decode(payload)',
      '        return self._dispatch(chunk)',
      '',
      '    def _dispatch(self, chunk: Chunk) -> Result:',
      '        for handler in self._handlers:',
      '            if handler.accepts(chunk):',
      '                return handler.run(chunk)',
      '        raise RuntimeError("no handler matched")'
    ],
    []
  )

  // Measure the text area and report book-text geometry to the reader engine.
  useLayoutEffect(() => {
    const area = areaRef.current
    const probe = probeRef.current
    if (!area || !probe) return

    const measure = (): void => {
      const charW = probe.getBoundingClientRect().width / 100
      const w = area.clientWidth
      const h = area.clientHeight
      if (!charW || !w || !h) return
      const totalRows = Math.max(1, Math.floor(h / LINE_H))
      const usableCols = Math.floor((w - GUTTER_PX) / charW)
      const columns = Math.max(20, usableCols - INDENT - 1)
      const bookRows = Math.max(1, totalRows - header.length - footer.length)
      setDims((prev) =>
        prev.columns === columns && prev.bookRows === bookRows ? prev : { columns, bookRows }
      )
      onGeometry({ columns, rows: bookRows })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(area)
    return () => ro.disconnect()
  }, [header.length, footer.length, onGeometry])

  // Assemble the full screen of rows: header + book docstring + footer + filler.
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = []
    let no = 1
    for (const h of header) result.push({ no: no++, node: pyLine(h) })
    for (const line of lines) {
      const node =
        line.trim() === '' ? ' ' : <span className="text-[#a9c585]">{'    ' + line}</span>
      result.push({ no: no++, node })
    }
    for (const f of footer) result.push({ no: no++, node: pyLine(f) })
    const fillCount = Math.max(0, dims.bookRows - lines.length)
    for (let i = 0; i < fillCount; i++) {
      result.push({ no: no++, node: pyLine(filler[i % filler.length]) })
    }
    return result
  }, [header, footer, filler, lines, dims.bookRows])

  return (
    <div className="flex h-full w-full flex-col bg-[#0d1117] text-[#c8ccd4]">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-[#1b2230] bg-[#0a0e14] text-xs">
        <div className="flex items-center gap-2 border-r border-[#1b2230] bg-[#0d1117] px-4 py-2">
          <span className="text-[#e5c07b]">{'●'}</span>
          <span className="text-[#c8ccd4]">{fileName}</span>
        </div>
        <div className="px-4 py-2 text-[#5c6370]">{modulePath}</div>
        <div className="ml-auto px-4 py-2 text-[#5c6370]">main {'•'} python 3.12</div>
      </div>

      {/* Code area */}
      <div
        ref={areaRef}
        className="relative flex-1 overflow-hidden"
        style={{ fontFamily: FONT_STACK, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
      >
        {rows.map((r, i) => (
          <div key={i} className="flex" style={{ height: LINE_H }}>
            <span
              className="select-none pr-3 text-right text-[#3b4252]"
              style={{ width: GUTTER_PX, minWidth: GUTTER_PX }}
            >
              {r.no}
            </span>
            <span className="overflow-hidden whitespace-pre">{r.node}</span>
          </div>
        ))}
        {/* Hidden probe for monospace char-width measurement. */}
        <span
          ref={probeRef}
          className="invisible absolute left-0 top-0 whitespace-pre"
          style={{ fontFamily: FONT_STACK, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
        >
          {'M'.repeat(100)}
        </span>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 border-t border-[#1b2230] bg-[#0a0e14] px-4 py-1 text-[11px] text-[#7d8694]">
        <span className="text-[#a9c585]">{'✓'} build passing</span>
        <span>UTF-8</span>
        <span>Python</span>
        <span className="truncate text-[#5c6370]">def {chapterTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}()</span>
        <span className="ml-auto">§{chapterIndex + 1}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  )
}
