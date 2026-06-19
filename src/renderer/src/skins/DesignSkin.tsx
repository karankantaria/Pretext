// Design Canvas skin (Creative). A vector editor (Illustrator/Figma vibe): dark
// UI, tool palette, layers + character + swatch panels, rulers, and a centred
// editorial artboard. The book text is the laid-out body copy, shown inside a
// selected text frame with handles and a blinking caret — i.e. being edited.

import { useEffect, useMemo, useRef } from 'react'
import { MonoProbe, PROSE_SAMPLE, useMonoMeasure } from './common'
import type { SkinProps } from './types'

const FONT_SIZE_BASE = 15
const LINE_H_BASE = 25
const ARTBOARD = "'Helvetica Neue', Arial, sans-serif"

const TOOLS = ['▶', '✒', 'T', '▭', '◯', '⌗', '✎', '⬚', '🖇', '🔍']
const ACTIVE_TOOL = 2 // Type tool

const LAYERS = [
  { name: 'Headline', color: '#e5934b' },
  { name: 'Body Copy', color: '#39b2f0', sel: true },
  { name: 'Accent Rule', color: '#a9c585' },
  { name: 'Image Frame', color: '#c678dd' },
  { name: 'Background', color: '#888' }
]

const SWATCHES = ['#1a1a1a', '#e5934b', '#39b2f0', '#a9c585', '#c678dd', '#e06c75', '#f4efe6', '#d8cdb8']

function Handle({ pos }: { pos: string }): React.JSX.Element {
  return (
    <span
      className={`absolute h-2 w-2 border border-white bg-[#39b2f0] ${pos}`}
      style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.3)' }}
    />
  )
}

export default function DesignSkin(props: SkinProps): React.JSX.Element {
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

  const para = useMemo(() => lines.map((line) => ({ line, empty: line.trim() === '' })), [lines])
  const docName = useMemo(
    () => book.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    [book.meta.title]
  )

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] text-[#c8c8c8]">
      {/* Menu bar */}
      <div className="flex items-center gap-3 border-b border-[#0e0e0e] bg-[#2a2a2a] px-3 py-1 text-[11px]">
        <span className="font-semibold text-[#e5934b]">Ai</span>
        {['File', 'Edit', 'Object', 'Type', 'Select', 'Effect', 'View', 'Window'].map((m) => (
          <span key={m} className="text-[#a8a8a8] hover:text-white">
            {m}
          </span>
        ))}
        <span className="ml-2 text-[#6a6a6a]">{docName}-spread.ai @ 100%</span>
        <span className="ml-auto text-[#6a6a6a]">RGB · Preview</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Tool palette */}
        <div className="flex w-9 shrink-0 flex-col items-center gap-0.5 border-r border-[#0e0e0e] bg-[#2a2a2a] py-2">
          {TOOLS.map((t, i) => (
            <span
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded text-sm ${
                i === ACTIVE_TOOL ? 'bg-[#39b2f0] text-white' : 'text-[#9a9a9a] hover:bg-[#3a3a3a]'
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Canvas with rulers */}
        <div className="relative min-w-0 flex-1 overflow-hidden bg-[#2b2b2b]">
          {/* rulers */}
          <div
            className="absolute left-5 right-0 top-0 h-5 border-b border-[#161616] bg-[#232323]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, #3a3a3a 0 1px, transparent 1px 40px)'
            }}
          />
          <div
            className="absolute bottom-0 left-0 top-5 w-5 border-r border-[#161616] bg-[#232323]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, #3a3a3a 0 1px, transparent 1px 40px)'
            }}
          />
          <div className="absolute left-0 top-0 h-5 w-5 border-b border-r border-[#161616] bg-[#232323]" />

          {/* artboard */}
          <div className="absolute bottom-0 left-5 right-0 top-5 flex justify-center overflow-hidden pt-5">
            <div
              className="relative flex w-[560px] max-w-[88%] flex-col bg-[#faf8f3] px-12 pb-8 pt-7 text-[#1c1c1c] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
              style={{ fontFamily: ARTBOARD }}
            >
              {/* selection bounding box + handles */}
              <div className="pointer-events-none absolute inset-2 border border-[#39b2f0]">
                <Handle pos="-left-1 -top-1" />
                <Handle pos="left-1/2 -top-1 -translate-x-1/2" />
                <Handle pos="-right-1 -top-1" />
                <Handle pos="-left-1 top-1/2 -translate-y-1/2" />
                <Handle pos="-right-1 top-1/2 -translate-y-1/2" />
                <Handle pos="-left-1 -bottom-1" />
                <Handle pos="left-1/2 -bottom-1 -translate-x-1/2" />
                <Handle pos="-right-1 -bottom-1" />
              </div>

              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#e5934b]">
                Feature
              </div>
              <h1
                className="mt-1 text-[26px] font-bold leading-[30px] text-[#1c1c1c]"
                style={{ letterSpacing: '-0.01em' }}
              >
                {chapterTitle}
                <span
                  className="ml-0.5 inline-block w-[2px] align-middle"
                  style={{ height: 24, background: '#39b2f0', animation: 'blink 1.1s steps(1) infinite' }}
                />
              </h1>
              <div className="my-2 h-1 w-16 bg-[#e5934b]" />

              <div
                ref={areaRef}
                className="relative min-h-0 flex-1 overflow-hidden"
                style={{ fontFamily: ARTBOARD, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
              >
                {para.map((p, i) => (
                  <div key={i} className="overflow-hidden whitespace-pre" style={{ height: LINE_H }}>
                    {p.empty ? ' ' : p.line}
                  </div>
                ))}
                <MonoProbe
                  probeRef={probeRef}
                  fontSize={FONT_SIZE}
                  lineHeight={LINE_H}
                  sample={PROSE_SAMPLE}
                  fontFamily={ARTBOARD}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right panels */}
        <div className="flex w-60 shrink-0 flex-col border-l border-[#0e0e0e] bg-[#262626] text-[11px]">
          {/* Layers */}
          <div className="border-b border-[#161616] p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-[#7a7a7a]">Layers</div>
            {LAYERS.map((l) => (
              <div
                key={l.name}
                className={`flex items-center gap-2 rounded px-1.5 py-1 ${
                  l.sel ? 'bg-[#39b2f0]/20 text-white' : 'text-[#b0b0b0]'
                }`}
              >
                <span className="text-[#6a6a6a]">◉</span>
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                <span>{l.name}</span>
                {l.sel && <span className="ml-auto text-[#39b2f0]">✎</span>}
              </div>
            ))}
          </div>

          {/* Character */}
          <div className="border-b border-[#161616] p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-[#7a7a7a]">Character</div>
            <div className="rounded bg-[#1e1e1e] px-2 py-1 text-[#cfcfcf]">Söhne · Buch</div>
            <div className="mt-1 grid grid-cols-2 gap-1 text-[#9a9a9a]">
              <span className="rounded bg-[#1e1e1e] px-2 py-1">{FONT_SIZE} pt</span>
              <span className="rounded bg-[#1e1e1e] px-2 py-1">{LINE_H} lh</span>
              <span className="rounded bg-[#1e1e1e] px-2 py-1">0 tr</span>
              <span className="rounded bg-[#1e1e1e] px-2 py-1">100%</span>
            </div>
          </div>

          {/* Swatches */}
          <div className="p-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-[#7a7a7a]">Swatches</div>
            <div className="grid grid-cols-8 gap-1">
              {SWATCHES.map((c) => (
                <span
                  key={c}
                  className="aspect-square rounded-sm border border-[#161616]"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-[#161616] p-2 text-[10px] text-[#6a6a6a]">
            Artboard 1 · §{chapterIndex + 1} · {Math.round(progress * 100)}%
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 border-t border-[#0e0e0e] bg-[#2a2a2a] px-3 py-1 text-[11px] text-[#7a7a7a]">
        <span>100%</span>
        <span>Selection: Body Copy</span>
        <span>X 84 Y 120 W 472 H 760 pt</span>
        <span className="ml-auto">{TOOLS[ACTIVE_TOOL]} Type Tool</span>
      </div>
    </div>
  )
}
