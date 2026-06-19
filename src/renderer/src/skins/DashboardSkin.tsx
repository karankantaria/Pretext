// Analytics / BI dashboard skin: live KPI tiles, an animated bar chart and a
// gauge, and a dominant "event stream" table where each row carries a line of
// book text — the readable surface.

import { useEffect, useMemo, useRef } from 'react'
import {
  BOOK_INK,
  MONO_FONT,
  MonoProbe,
  Sparkline,
  fixCols,
  hashStr,
  pad2,
  useInterval,
  useMonoMeasure,
  useSeries,
  useTicker
} from './common'
import { useState } from 'react'
import type { SkinProps } from './types'

const FONT_SIZE_BASE = 13
const LINE_H_BASE = 22
const PREFIX_COLS = 16

const TAGS = [
  { t: 'EVT', c: '#a9c585' },
  { t: 'USR', c: '#61afef' },
  { t: 'SYS', c: '#56b6c2' },
  { t: 'API', c: '#c678dd' }
]

function Tile({
  label,
  value,
  unit,
  color,
  data
}: {
  label: string
  value: string
  unit?: string
  color: string
  data: number[]
}): React.JSX.Element {
  return (
    <div className="flex-1 rounded-lg border border-[#1b2230] bg-[#0d1117] p-3">
      <div className="text-[10px] uppercase tracking-wider text-[#5c6370]">{label}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-2xl font-semibold tabular-nums text-[#e6edf3]">
          {value}
          {unit && <span className="ml-1 text-xs text-[#5c6370]">{unit}</span>}
        </div>
        <Sparkline data={data} color={color} width={72} height={26} fill />
      </div>
    </div>
  )
}

function BarChart({ data, color }: { data: number[]; color: string }): React.JSX.Element {
  const max = Math.max(...data, 1)
  return (
    <div className="flex h-full items-end gap-1">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-700"
          style={{
            height: `${(v / max) * 100}%`,
            background: `linear-gradient(to top, ${color}33, ${color})`
          }}
        />
      ))}
    </div>
  )
}

function Gauge({ value, color }: { value: number; color: string }): React.JSX.Element {
  const r = 34
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div className="relative grid place-items-center">
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" stroke="#1b2230" strokeWidth={8} />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-sm font-semibold tabular-nums text-[#e6edf3]">
        {Math.round(value)}%
      </div>
    </div>
  )
}

export default function DashboardSkin(props: SkinProps): React.JSX.Element {
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

  const tick = useTicker(1500)
  const seed = useMemo(() => hashStr(book.meta.title) + chapterIndex * 101, [book, chapterIndex])
  const revenue = useSeries(28, 1100, 48, 18)
  const sessions = useSeries(28, 900, 7200, 2400)
  const latency = useSeries(28, 700, 120, 60)
  const bars = useSeries(16, 1300, 60, 40)
  const [gauge, setGauge] = useState(72)
  useInterval(() => setGauge(60 + Math.random() * 35), 1600)

  const eventRows = useMemo(() => {
    const out: { prefix: string; tag: (typeof TAGS)[number]; msg: string; book: boolean }[] = []
    const time = (i: number): string => {
      const t = 9 * 3600 + (seed % 40000) + i * 11
      return `${pad2(Math.floor(t / 3600) % 24)}:${pad2(Math.floor(t / 60) % 60)}:${pad2(t % 60)}`
    }
    lines.forEach((line, i) => {
      const isText = line.trim() !== ''
      out.push({
        prefix: fixCols(time(i), 8),
        tag: TAGS[(seed + i) % TAGS.length],
        msg: isText ? line : '—',
        book: isText
      })
    })
    for (let i = lines.length; i < bookRows; i++) {
      out.push({
        prefix: fixCols(time(i), 8),
        tag: TAGS[(seed + i) % TAGS.length],
        msg: 'session.commit ok · 200 · 14ms',
        book: false
      })
    }
    return out
  }, [lines, bookRows, seed])

  return (
    <div className="flex h-full w-full flex-col gap-3 bg-[#080b11] p-3 text-[#c8ccd4]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#a9c585]" />
        <span className="text-sm font-semibold text-[#e6edf3]">Operations Overview</span>
        <span className="text-xs text-[#5c6370]">realtime · last 24h</span>
        <span className="ml-auto text-xs tabular-nums text-[#5c6370]">
          synced {pad2(tick % 60)}s ago
        </span>
      </div>

      {/* KPI tiles */}
      <div className="flex gap-3">
        <Tile
          label="Revenue"
          value={`$${revenue[revenue.length - 1].toFixed(1)}K`}
          color="#a9c585"
          data={revenue}
        />
        <Tile
          label="Active Sessions"
          value={Math.round(sessions[sessions.length - 1]).toLocaleString()}
          color="#61afef"
          data={sessions}
        />
        <Tile
          label="p95 Latency"
          value={Math.round(latency[latency.length - 1]).toString()}
          unit="ms"
          color="#e5c07b"
          data={latency}
        />
        <Tile label="Error Rate" value="0.03" unit="%" color="#e06c75" data={latency} />
      </div>

      {/* Main: charts + event stream */}
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex w-72 shrink-0 flex-col gap-3">
          <div className="flex-1 rounded-lg border border-[#1b2230] bg-[#0d1117] p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-[#5c6370]">
              Throughput / region
            </div>
            <div className="h-[calc(100%-1.5rem)]">
              <BarChart data={bars} color="#61afef" />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[#1b2230] bg-[#0d1117] p-3">
            <Gauge value={gauge} color="#a9c585" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#5c6370]">SLA health</div>
              <div className="text-lg font-semibold text-[#e6edf3]">Nominal</div>
              <div className="text-xs text-[#5c6370]">all systems green</div>
            </div>
          </div>
        </div>

        {/* Event stream — the reading surface */}
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[#1b2230] bg-[#0d1117]">
          <div className="flex items-center gap-2 border-b border-[#1b2230] px-3 py-2 text-[10px] uppercase tracking-wider text-[#5c6370]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a9c585]" />
            Event Stream
            <span className="ml-auto normal-case text-[#3b4252]">§{chapterIndex + 1}</span>
          </div>
          <div
            ref={areaRef}
            className="relative min-h-0 flex-1 overflow-hidden px-3 py-1"
            style={{ fontFamily: MONO_FONT, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
          >
            {eventRows.map((r, i) => (
              <div key={i} className="flex items-baseline whitespace-pre" style={{ height: LINE_H }}>
                <span className="text-[#3b4756]">{r.prefix} </span>
                <span style={{ color: r.tag.c }}>{r.tag.t} </span>
                <span className="overflow-hidden" style={{ color: r.book ? BOOK_INK : '#56657a' }}>
                  {r.msg}
                </span>
              </div>
            ))}
            <MonoProbe probeRef={probeRef} fontSize={FONT_SIZE} lineHeight={LINE_H} />
          </div>
          <div className="flex gap-3 border-t border-[#1b2230] px-3 py-1 text-[11px] text-[#5c6370]">
            <span className="text-[#a9c585]">live</span>
            <span className="ml-auto tabular-nums">{Math.round(progress * 100)}% indexed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
