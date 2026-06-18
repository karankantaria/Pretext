// Security Operations Center skin: a dark tactical world grid with glowing
// nodes and animated attack arcs pinging between them, live counters, and a
// "threat feed" panel where each book line is an event description — readable.

import { useEffect, useMemo, useRef } from 'react'
import {
  BOOK_INK,
  MONO_FONT,
  MonoProbe,
  fixCols,
  hashStr,
  useMonoMeasure,
  useSeries,
  useTicker
} from './common'
import type { SkinProps } from './types'

const FONT_SIZE = 13
const LINE_H = 22
const PREFIX_COLS = 21

const SEV = [
  { s: 'CRIT', c: '#e06c75' },
  { s: 'HIGH', c: '#e5934b' },
  { s: 'MED ', c: '#e5c07b' },
  { s: 'LOW ', c: '#56b6c2' }
]

const NODES = [
  { x: 18, y: 20 }, // N America
  { x: 30, y: 34 },
  { x: 47, y: 16 }, // Europe
  { x: 52, y: 30 },
  { x: 58, y: 24 },
  { x: 70, y: 22 }, // Asia
  { x: 78, y: 34 },
  { x: 48, y: 44 }, // Africa
  { x: 84, y: 46 } // Oceania
]

function arcPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.45
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`
}

function rngIp(seed: number): string {
  const o = (n: number): number => ((seed * (n + 7)) % 223) + 1
  return `${o(1)}.${o(2)}.${o(3)}.${o(4)}`
}

export default function SocSkin(props: SkinProps): React.JSX.Element {
  const { book, lines, chapterIndex, progress, onGeometry } = props
  const areaRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const { cols, rows } = useMonoMeasure(areaRef, probeRef, LINE_H)

  const columns = Math.max(20, cols - PREFIX_COLS - 1)
  const bookRows = rows
  useEffect(() => {
    onGeometry({ columns, rows: bookRows })
  }, [columns, bookRows, onGeometry])

  const tick = useTicker(1000)
  const blocked = useSeries(30, 800, 1200, 600)
  const seed = useMemo(() => hashStr(book.meta.title) + chapterIndex * 17, [book, chapterIndex])

  // Faint tactical dot grid (fakes landmasses without a real map).
  const dots = useMemo(() => {
    const out: { x: number; y: number; o: number }[] = []
    for (let x = 4; x < 98; x += 3) {
      for (let y = 6; y < 56; y += 3) {
        const h = (Math.sin(x * 0.5) + Math.cos(y * 0.7) + Math.sin((x + y) * 0.3)) / 3
        if (h > -0.1) out.push({ x, y, o: 0.05 + Math.max(0, h) * 0.12 })
      }
    }
    return out
  }, [])

  const arcs = useMemo(() => {
    const list: { d: string; c: string; dur: number }[] = []
    const colors = ['#e06c75', '#e5c07b', '#56b6c2', '#c678dd', '#e5934b']
    for (let i = 0; i < 6; i++) {
      const a = NODES[(seed + i * 3) % NODES.length]
      const b = NODES[(seed + i * 5 + 2) % NODES.length]
      if (a === b) continue
      list.push({ d: arcPath(a, b), c: colors[i % colors.length], dur: 2.4 + (i % 4) * 0.7 })
    }
    return list
  }, [seed])

  const feed = useMemo(() => {
    const out: { prefix: string; sev: (typeof SEV)[number]; msg: string; book: boolean }[] = []
    lines.forEach((line, i) => {
      const sev = SEV[line.trim() === '' ? 3 : (seed + i) % SEV.length]
      out.push({
        prefix: fixCols(`${sev.s} ${rngIp(seed + i)}`, PREFIX_COLS),
        sev,
        msg: line.trim() === '' ? '· · ·' : line,
        book: line.trim() !== ''
      })
    })
    for (let i = lines.length; i < bookRows; i++) {
      const sev = SEV[(seed + i) % SEV.length]
      out.push({
        prefix: fixCols(`${sev.s} ${rngIp(seed + i)}`, PREFIX_COLS),
        sev,
        msg: 'signature match · rule ET-2049 · dropped',
        book: false
      })
    }
    return out
  }, [lines, bookRows, seed])

  return (
    <div className="flex h-full w-full bg-[#04060a] text-[#c8ccd4]">
      {/* Map */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          {/* grid */}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={60} stroke="#0e1a2b" strokeWidth={0.1} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="#0e1a2b" strokeWidth={0.1} />
          ))}
          {/* landmass dots */}
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={0.5} fill="#2b7fb0" opacity={d.o} />
          ))}
          {/* arcs with travelling pings */}
          {arcs.map((a, i) => (
            <g key={i}>
              <path d={a.d} fill="none" stroke={a.c} strokeWidth={0.25} opacity={0.5}>
                <animate
                  attributeName="stroke-opacity"
                  values="0.15;0.7;0.15"
                  dur={`${a.dur}s`}
                  repeatCount="indefinite"
                />
              </path>
              <circle r={0.7} fill={a.c}>
                <animateMotion dur={`${a.dur}s`} repeatCount="indefinite" path={a.d} />
                <animate attributeName="r" values="0.4;0.9;0.4" dur={`${a.dur}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
          {/* nodes */}
          {NODES.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={2.4} fill="#56b6c2" opacity={0.12}>
                <animate attributeName="r" values="1.6;3.2;1.6" dur="2.6s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.18;0.02;0.18" dur="2.6s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={n.x} cy={n.y} r={0.8} fill="#7fe1ef" />
            </g>
          ))}
        </svg>

        {/* counters overlay */}
        <div className="pointer-events-none absolute left-4 top-4 space-y-2">
          <div className="rounded-md border border-[#13283a] bg-[#06101a]/80 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest text-[#3f6d8a]">Threats blocked</div>
            <div className="text-2xl font-bold tabular-nums text-[#7fe1ef]">
              {(184000 + tick * 13).toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="rounded-md border border-[#3a1620] bg-[#1a0608]/80 px-3 py-1.5">
              <div className="text-[9px] uppercase tracking-widest text-[#8a3f4a]">Critical</div>
              <div className="text-lg font-bold tabular-nums text-[#e06c75]">{3 + (tick % 3)}</div>
            </div>
            <div className="rounded-md border border-[#13283a] bg-[#06101a]/80 px-3 py-1.5">
              <div className="text-[9px] uppercase tracking-widest text-[#3f6d8a]">Inbound/s</div>
              <div className="text-lg font-bold tabular-nums text-[#56b6c2]">
                {Math.round(blocked[blocked.length - 1])}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-4 text-[10px] uppercase tracking-widest text-[#2f5876]">
          ● live · global threat intelligence grid
        </div>
      </div>

      {/* Threat feed — reading surface */}
      <div className="flex w-[46%] min-w-0 flex-col border-l border-[#13283a] bg-[#060a10]">
        <div className="flex items-center gap-2 border-b border-[#13283a] px-3 py-2 text-[10px] uppercase tracking-widest text-[#3f6d8a]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e06c75]" />
          Threat Feed
          <span className="ml-auto normal-case text-[#1f3f57]">sensor §{chapterIndex + 1}</span>
        </div>
        <div
          ref={areaRef}
          className="relative min-h-0 flex-1 overflow-hidden px-3 py-1"
          style={{ fontFamily: MONO_FONT, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
        >
          {feed.map((r, i) => (
            <div key={i} className="flex whitespace-pre" style={{ height: LINE_H }}>
              <span style={{ color: r.sev.c }}>{r.prefix}</span>
              <span className="text-[#2f5876]"> ▸ </span>
              <span className="overflow-hidden" style={{ color: r.book ? BOOK_INK : '#3f6d8a' }}>
                {r.msg}
              </span>
            </div>
          ))}
          <MonoProbe probeRef={probeRef} fontSize={FONT_SIZE} lineHeight={LINE_H} />
        </div>
        <div className="flex gap-3 border-t border-[#13283a] px-3 py-1 text-[11px] text-[#2f5876]">
          <span className="text-[#56b6c2]">● armed</span>
          <span>autoblock=on</span>
          <span className="ml-auto tabular-nums">{Math.round(progress * 100)}% triaged</span>
        </div>
      </div>
    </div>
  )
}
