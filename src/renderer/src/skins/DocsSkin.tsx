// Google Docs skin (Office). The Docs chrome: title bar with menus + Share +
// collaborator avatars, the rounded toolbar, a white page on a pale canvas. The
// book text is the document body; a live collaborator caret and a margin
// comment supply ambient motion. Proportional font (measured via PROSE_SAMPLE).

import { useEffect, useMemo, useRef } from 'react'
import { MonoProbe, PROSE_SAMPLE, useMonoMeasure } from './common'
import type { SkinProps } from './types'

const FONT_SIZE = 15
const LINE_H = 25
const ARIAL = "Arial, 'Helvetica Neue', 'Liberation Sans', sans-serif"

const MENUS = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help']
const COLLAB = [
  { name: 'Sam', color: '#34a853' },
  { name: 'Priya', color: '#ea4335' },
  { name: 'Jordan', color: '#fbbc04' }
]

function ToolBtn({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="flex h-7 min-w-7 items-center justify-center rounded px-1 text-[#444746] hover:bg-[#e8eaed]">
      {children}
    </span>
  )
}

export default function DocsSkin(props: SkinProps): React.JSX.Element {
  const { book, lines, chapterTitle, chapterIndex, progress, onGeometry } = props
  const areaRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const { cols, rows } = useMonoMeasure(areaRef, probeRef, LINE_H)

  const columns = Math.max(20, cols - 2)
  const bookRows = rows
  useEffect(() => {
    onGeometry({ columns, rows: bookRows })
  }, [columns, bookRows, onGeometry])

  const para = useMemo(
    () =>
      lines.map((line, i) => ({
        line,
        empty: line.trim() === '',
        start: line.trim() !== '' && (i === 0 || lines[i - 1].trim() === '')
      })),
    [lines]
  )

  return (
    <div className="flex h-full w-full flex-col bg-[#f9fbfd] text-[#3c4043]">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-3 pt-2">
        <span className="text-2xl text-[#4285f4]">🗎</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[17px] text-[#3c4043]">{book.meta.title} — Notes</span>
            <span className="text-[#5f6368]">☆</span>
          </div>
          <div className="-mt-0.5 flex items-center gap-3 text-[12px] text-[#444746]">
            {MENUS.map((m) => (
              <span key={m} className="hover:text-black">
                {m}
              </span>
            ))}
            <span className="text-[#5f6368]">All changes saved in Drive</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-2">
            {COLLAB.map((c) => (
              <span
                key={c.name}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[11px] font-medium text-white"
                style={{ background: c.color }}
                title={c.name}
              >
                {c.name[0]}
              </span>
            ))}
          </div>
          <span className="rounded-full bg-[#c2e7ff] px-4 py-1.5 text-[13px] font-medium text-[#001d35]">
            🔒 Share
          </span>
        </div>
      </div>

      {/* Toolbar pill */}
      <div className="px-3 py-1.5">
        <div className="flex items-center gap-1 rounded-full bg-[#edf2fa] px-3 py-1 text-[14px]">
          <ToolBtn>↶</ToolBtn>
          <ToolBtn>↷</ToolBtn>
          <ToolBtn>🖶</ToolBtn>
          <span className="mx-1 h-5 w-px bg-[#c7c7c7]" />
          <span className="flex h-7 items-center rounded px-2 text-[13px] text-[#444746] hover:bg-[#e8eaed]">
            100%
          </span>
          <span className="mx-1 h-5 w-px bg-[#c7c7c7]" />
          <span className="flex h-7 items-center rounded px-2 text-[13px] text-[#444746] hover:bg-[#e8eaed]">
            Normal text ▾
          </span>
          <span className="flex h-7 items-center rounded px-2 text-[13px] text-[#444746] hover:bg-[#e8eaed]">
            Arial ▾
          </span>
          <span className="mx-1 h-5 w-px bg-[#c7c7c7]" />
          <ToolBtn>−</ToolBtn>
          <span className="text-[13px]">11</span>
          <ToolBtn>+</ToolBtn>
          <span className="mx-1 h-5 w-px bg-[#c7c7c7]" />
          <ToolBtn><b>B</b></ToolBtn>
          <ToolBtn><i>I</i></ToolBtn>
          <ToolBtn><u>U</u></ToolBtn>
          <ToolBtn><span className="text-[#1a73e8]">A</span></ToolBtn>
          <span className="mx-1 h-5 w-px bg-[#c7c7c7]" />
          <ToolBtn>🔗</ToolBtn>
          <ToolBtn>🖼</ToolBtn>
          <ToolBtn>💬</ToolBtn>
          <span className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] text-[#1a73e8] hover:bg-[#e8f0fe]">
            ✎ Editing ▾
          </span>
        </div>
      </div>

      {/* Canvas + page */}
      <div className="relative flex flex-1 justify-center overflow-hidden pt-3">
        <div
          className="relative flex w-[720px] max-w-[88%] flex-col bg-white px-[88px] pb-8 pt-10 shadow-[0_1px_3px_rgba(60,64,67,0.3)]"
          style={{ fontFamily: ARIAL }}
        >
          <h1 className="mb-2 text-[20px] font-medium text-[#202124]" style={{ lineHeight: '28px' }}>
            {chapterTitle}
          </h1>
          <div
            ref={areaRef}
            className="relative min-h-0 flex-1 overflow-hidden text-[#202124]"
            style={{ fontFamily: ARIAL, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
          >
            {/* Live collaborator caret */}
            <div className="pointer-events-none absolute" style={{ top: LINE_H * 2, left: '32%' }}>
              <div
                className="absolute -top-4 whitespace-nowrap rounded px-1 py-0.5 text-[10px] text-white"
                style={{ background: COLLAB[0].color }}
              >
                {COLLAB[0].name}
              </div>
              <span
                className="block w-[2px]"
                style={{ height: LINE_H, background: COLLAB[0].color, animation: 'blink 1.1s steps(1) infinite' }}
              />
            </div>

            {para.map((p, i) => (
              <div
                key={i}
                className="overflow-hidden whitespace-pre"
                style={{ height: LINE_H, textIndent: p.start ? '1.5em' : 0 }}
              >
                {p.empty ? ' ' : p.line}
              </div>
            ))}
            <MonoProbe
              probeRef={probeRef}
              fontSize={FONT_SIZE}
              lineHeight={LINE_H}
              sample={PROSE_SAMPLE}
              fontFamily={ARIAL}
            />
          </div>

          {/* Margin comment */}
          <div className="absolute -right-2 top-28 hidden w-56 translate-x-full rounded-lg border border-[#dadce0] bg-white p-3 shadow-md xl:block">
            <div className="flex items-center gap-2">
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-medium text-white"
                style={{ background: COLLAB[1].color }}
              >
                {COLLAB[1].name[0]}
              </span>
              <span className="text-[12px] font-medium text-[#202124]">{COLLAB[1].name}</span>
              <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-[#34a853]" />
            </div>
            <div className="mt-1 text-[12px] text-[#3c4043]">
              Nice section — can we tighten the opening a little?
            </div>
            <div className="mt-1 text-[10px] text-[#5f6368]">Just now</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-1 text-[11px] text-[#5f6368]">
        <span>Page {chapterIndex + 1} of {book.meta.chapterCount}</span>
        <span className="ml-auto">{Math.round(progress * 100)}% · {COLLAB.length + 1} editors</span>
      </div>
    </div>
  )
}
