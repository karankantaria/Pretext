// Log Stream skin: a full-screen colour-coded server log console. Each line of
// book text becomes the human-readable message of an INFO log line; the rest of
// the screen is live header stats + synthetic system chatter to fill short pages.

import { useEffect, useMemo, useRef } from 'react'
import {
  BOOK_INK,
  MONO_FONT,
  MonoProbe,
  Sparkline,
  fixCols,
  hashStr,
  pad2,
  slugify,
  useMonoMeasure,
  useSeries,
  useTicker
} from './common'
import type { SkinProps } from './types'

const FONT_SIZE_BASE = 13
const LINE_H_BASE = 22
const PREFIX_COLS = 22

const LEVEL_COLOR: Record<string, string> = {
  INFO: '#56b6c2',
  DEBUG: '#5c6370',
  WARN: '#e5c07b',
  ERROR: '#e06c75',
  TRACE: '#7d8694'
}

const FILLER = [
  ['DEBUG', 'connection pool: acquired lease (idle=7, active=12)'],
  ['TRACE', 'gc: young collection 3.2ms, promoted 1.1MB'],
  ['INFO', 'heartbeat ok · p99=41ms · rps=1843'],
  ['DEBUG', 'cache hit ratio 0.94 over 30s window'],
  ['WARN', 'retry scheduled for upstream shard-04 in 250ms'],
  ['INFO', 'flushed 2048 records to write-ahead log'],
  ['DEBUG', 'rebalanced 3 partitions across 5 workers'],
  ['TRACE', 'span closed: handler.dispatch 0.7ms']
]

function timeFor(seed: number, row: number): string {
  const base = 8 * 3600 + (seed % 50000)
  const t = base + row * 7 + (seed % 13)
  const h = Math.floor(t / 3600) % 24
  const m = Math.floor(t / 60) % 60
  const s = t % 60
  const ms = (seed * (row + 3)) % 1000
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${ms.toString().padStart(3, '0')}`
}

interface Line {
  prefix: string
  level: string
  msg: string
  book: boolean
}

export default function LogSkin(props: SkinProps): React.JSX.Element {
  const { book, lines, chapterIndex, progress, fontScale, onGeometry } = props
  const FONT_SIZE = Math.round(FONT_SIZE_BASE * fontScale)
  const LINE_H = Math.round(LINE_H_BASE * fontScale)
  const areaRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const { cols, rows } = useMonoMeasure(areaRef, probeRef, LINE_H)

  const columns = Math.max(24, cols - PREFIX_COLS - 1)
  const bookRows = rows
  useEffect(() => {
    onGeometry({ columns, rows: bookRows })
  }, [columns, bookRows, onGeometry])

  const tick = useTicker(1000)
  const throughput = useSeries(40, 900, 1800, 700)
  const logger = useMemo(() => `svc.${slugify(book.meta.title).slice(0, 8)}`, [book.meta.title])
  const seed = useMemo(() => hashStr(book.meta.title) + chapterIndex * 1009, [book, chapterIndex])

  const rendered = useMemo<Line[]>(() => {
    const out: Line[] = []
    lines.forEach((line, i) => {
      const lvl = line.trim() === '' ? 'TRACE' : 'INFO'
      out.push({
        prefix: fixCols(`${timeFor(seed, i)} ${lvl}`, PREFIX_COLS),
        level: lvl,
        msg: line.trim() === '' ? `${logger}` : line,
        book: line.trim() !== ''
      })
    })
    for (let i = lines.length; i < bookRows; i++) {
      const [lvl, msg] = FILLER[(seed + i) % FILLER.length]
      out.push({
        prefix: fixCols(`${timeFor(seed, i)} ${lvl}`, PREFIX_COLS),
        level: lvl,
        msg,
        book: false
      })
    }
    return out
  }, [lines, bookRows, seed, logger])

  const counts = {
    info: 18400 + tick * 7,
    warn: 213 + (tick % 5),
    error: 12
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#070a0f] text-[#c8ccd4]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#16202b] bg-[#0a0f16] px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#56b6c2] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#56b6c2]" />
          </span>
          <span className="font-semibold text-[#56b6c2]">journalctl</span>
          <span className="text-[#5c6370]">-f -u {logger}.service</span>
        </div>
        <div className="ml-2 flex gap-3 text-[11px]">
          <span className="text-[#56b6c2]">INFO {counts.info.toLocaleString()}</span>
          <span className="text-[#e5c07b]">WARN {counts.warn}</span>
          <span className="text-[#e06c75]">ERROR {counts.error}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[#5c6370]">
          <span>throughput</span>
          <Sparkline data={throughput} color="#56b6c2" width={120} height={20} fill />
          <span className="tabular-nums text-[#56b6c2]">
            {Math.round(throughput[throughput.length - 1])}/s
          </span>
        </div>
      </div>

      {/* Log body */}
      <div
        ref={areaRef}
        className="relative flex-1 overflow-hidden px-4 py-1"
        style={{ fontFamily: MONO_FONT, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
      >
        {rendered.map((l, i) => (
          <div key={i} className="flex whitespace-pre" style={{ height: LINE_H }}>
            <span className="text-[#3b4756]">{l.prefix.slice(0, 13)}</span>
            <span style={{ color: LEVEL_COLOR[l.level] }}>{l.prefix.slice(13)}</span>
            <span
              className="overflow-hidden"
              style={{ color: l.book ? BOOK_INK : '#56657a' }}
            >
              {l.book ? l.msg : l.msg}
            </span>
          </div>
        ))}
        <MonoProbe probeRef={probeRef} fontSize={FONT_SIZE} lineHeight={LINE_H} />
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 border-t border-[#16202b] bg-[#0a0f16] px-4 py-1 text-[11px] text-[#5c6370]">
        <span className="text-[#56b6c2]">● streaming</span>
        <span>stdout</span>
        <span>follow=true</span>
        <span className="ml-auto">buffer §{chapterIndex + 1}</span>
        <span className="tabular-nums">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  )
}
