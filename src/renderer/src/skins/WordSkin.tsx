// Word Document skin (Office). An authentic-looking word processor: blue title
// bar, ribbon, ruler, a white page on a grey canvas, and a status bar. The book
// text is the document body — framed as a corporate report so it reads as work,
// not a novel. Uses a proportional font (measured via PROSE_SAMPLE).

import { useEffect, useMemo, useRef } from 'react'
import { MonoProbe, PROSE_SAMPLE, useMonoMeasure } from './common'
import type { SkinProps } from './types'

const FONT_SIZE_BASE = 15
const LINE_H_BASE = 26
const SANS = "'Segoe UI', Calibri, 'Helvetica Neue', Arial, sans-serif"

const RIBBON_TABS = [
  'File', 'Home', 'Insert', 'Draw', 'Design', 'Layout', 'References', 'Review', 'View', 'Help'
]

function RibbonBtn({ children, w = 'auto' }: { children: React.ReactNode; w?: string }): React.JSX.Element {
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm border border-transparent px-1.5 py-0.5 text-[#444] hover:border-[#c8c6c4] hover:bg-white"
      style={{ width: w }}
    >
      {children}
    </span>
  )
}

export default function WordSkin(props: SkinProps): React.JSX.Element {
  const { book, lines, chapterTitle, chapterIndex, progress, fontScale, onGeometry } = props
  const FONT_SIZE = Math.round(FONT_SIZE_BASE * fontScale)
  const LINE_H = Math.round(LINE_H_BASE * fontScale)
  const areaRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const { cols, rows } = useMonoMeasure(areaRef, probeRef, LINE_H)

  const columns = Math.max(20, cols - 2)
  const bookRows = rows
  useEffect(() => {
    onGeometry({ columns, rows: bookRows })
  }, [columns, bookRows, onGeometry])

  // Mark paragraph starts (after a blank line) for first-line indents.
  const para = useMemo(() => {
    return lines.map((line, i) => ({
      line,
      empty: line.trim() === '',
      start: line.trim() !== '' && (i === 0 || lines[i - 1].trim() === '')
    }))
  }, [lines])

  const words = useMemo(
    () => 240 + chapterIndex * 1180 + Math.round(progress * 900),
    [chapterIndex, progress]
  )

  return (
    <div className="flex h-full w-full flex-col bg-[#e6e6e6] text-[#444]">
      {/* Title bar */}
      <div className="flex items-center bg-[#185abd] px-3 py-1 text-xs text-white">
        <span className="font-medium">
          {book.meta.title} — Compiled Report.docx
        </span>
        <span className="mx-2 text-white/70">· Saved to OneDrive</span>
        <div className="ml-auto flex gap-3 text-white/80">
          <span>—</span>
          <span>▢</span>
          <span>✕</span>
        </div>
      </div>

      {/* Ribbon tabs */}
      <div className="flex items-center gap-1 bg-[#185abd] px-2 text-[11px]">
        {RIBBON_TABS.map((t, i) => (
          <span
            key={t}
            className={`rounded-t px-2.5 py-1 ${
              i === 1 ? 'bg-[#f3f2f1] text-[#185abd]' : 'text-white/90 hover:bg-white/10'
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Ribbon controls */}
      <div className="flex items-center gap-2 border-b border-[#d2d0ce] bg-[#f3f2f1] px-2 py-1 text-[12px]">
        <RibbonBtn>Calibri (Body)</RibbonBtn>
        <RibbonBtn w="34px">11</RibbonBtn>
        <span className="mx-1 h-4 w-px bg-[#d2d0ce]" />
        <RibbonBtn><b>B</b></RibbonBtn>
        <RibbonBtn><i>I</i></RibbonBtn>
        <RibbonBtn><u>U</u></RibbonBtn>
        <RibbonBtn>x²</RibbonBtn>
        <span className="mx-1 h-4 w-px bg-[#d2d0ce]" />
        <RibbonBtn>≡</RibbonBtn>
        <RibbonBtn>☰</RibbonBtn>
        <RibbonBtn>⊟</RibbonBtn>
        <span className="mx-1 h-4 w-px bg-[#d2d0ce]" />
        <span className="rounded-sm border border-[#d2d0ce] bg-white px-2 py-0.5 text-[11px] text-[#185abd]">
          AaBb Heading 1
        </span>
        <span className="rounded-sm px-2 py-0.5 text-[11px] text-[#666]">AaBbCcDd Normal</span>
        <RibbonBtn>⌕ Editing</RibbonBtn>
      </div>

      {/* Ruler */}
      <div className="flex justify-center bg-[#e6e6e6] py-1">
        <div className="relative h-4 w-[760px] max-w-[92%] rounded-sm bg-white shadow-inner">
          <div className="absolute inset-y-0 left-0 w-12 bg-[#dfe4ea]" />
          <div className="absolute inset-y-0 right-0 w-12 bg-[#dfe4ea]" />
        </div>
      </div>

      {/* Canvas + page */}
      <div className="flex flex-1 justify-center overflow-hidden bg-[#e6e6e6] pt-1">
        <div
          className="flex w-[760px] max-w-[92%] flex-col bg-white px-16 pb-6 pt-8 shadow-[0_2px_14px_rgba(0,0,0,0.25)]"
          style={{ fontFamily: SANS }}
        >
          <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider text-[#9a9a9a]">
            <span>Confidential · Internal Draft</span>
            <span>Rev {chapterIndex + 1}.0</span>
          </div>
          <h1
            className="mb-2 border-b border-[#e1e1e1] pb-1 text-[22px] font-semibold text-[#2e74b5]"
            style={{ lineHeight: '30px' }}
          >
            {chapterTitle}
          </h1>
          <div
            ref={areaRef}
            className="relative min-h-0 flex-1 overflow-hidden text-[#1f1f1f]"
            style={{ fontFamily: SANS, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
          >
            {para.map((p, i) => (
              <div
                key={i}
                className="overflow-hidden whitespace-pre"
                style={{ height: LINE_H, textIndent: p.start ? '2em' : 0 }}
              >
                {p.empty ? ' ' : p.line}
              </div>
            ))}
            <MonoProbe
              probeRef={probeRef}
              fontSize={FONT_SIZE}
              lineHeight={LINE_H}
              sample={PROSE_SAMPLE}
              fontFamily={SANS}
            />
          </div>
          <div className="mt-2 border-t border-[#eee] pt-1 text-center text-[10px] text-[#b0b0b0]">
            {chapterIndex + 1} · Compiled Report
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 bg-[#185abd] px-3 py-0.5 text-[11px] text-white/90">
        <span>Page {chapterIndex + 1} of {book.meta.chapterCount}</span>
        <span>{words.toLocaleString()} words</span>
        <span>English (United States)</span>
        <span className="ml-auto">{'✎'} Editing</span>
        <span>{Math.round(progress * 100)}%</span>
        <span className="tracking-tight">— ▬ +</span>
      </div>
    </div>
  )
}
