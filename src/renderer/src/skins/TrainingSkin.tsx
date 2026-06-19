// ML training-run skin: descending loss / ascending accuracy curves, GPU
// telemetry, an epoch progress bar, and a streaming training log on the left
// where each book line is logged as a "sample output" — the readable surface.

import { useEffect, useMemo, useRef } from 'react'
import {
  BOOK_INK,
  MONO_FONT,
  MonoProbe,
  Sparkline,
  fixCols,
  hashStr,
  useDescending,
  useMonoMeasure,
  useSeries,
  useTicker
} from './common'
import type { SkinProps } from './types'

const FONT_SIZE_BASE = 13
const LINE_H_BASE = 22
const PREFIX_COLS = 15

function Stat({ label, value, color }: { label: string; value: string; color: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-[#211c10] bg-[#120f08] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-[#6b5a2e]">{label}</div>
      <div className="text-sm font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

export default function TrainingSkin(props: SkinProps): React.JSX.Element {
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

  const tick = useTicker(1200)
  const loss = useDescending(48, 800, 1.4)
  const acc = useSeries(48, 800, 0.93, 0.05)
  const gpu0 = useSeries(8, 1000, 94, 6)
  const gpu1 = useSeries(8, 1000, 88, 9)
  const seed = useMemo(() => hashStr(book.meta.title) + chapterIndex * 7, [book, chapterIndex])

  const epoch = 12 + (chapterIndex % 40)
  const curLoss = loss[loss.length - 1]
  const curAcc = acc[acc.length - 1]

  const logRows = useMemo(() => {
    const out: { prefix: string; msg: string; book: boolean }[] = []
    lines.forEach((line, i) => {
      const step = 3400 + i * 8
      out.push({
        prefix: fixCols(`[e${epoch}|s${step}]`, PREFIX_COLS),
        msg: line.trim() === '' ? '' : line,
        book: line.trim() !== ''
      })
    })
    for (let i = lines.length; i < bookRows; i++) {
      const step = 3400 + i * 8
      const l = (curLoss * (0.9 + ((seed + i) % 20) / 100)).toFixed(4)
      out.push({
        prefix: fixCols(`[e${epoch}|s${step}]`, PREFIX_COLS),
        msg: `loss=${l} lr=3.0e-4 grad_norm=${(0.4 + ((seed + i) % 30) / 50).toFixed(2)}`,
        book: false
      })
    }
    return out
  }, [lines, bookRows, epoch, curLoss, seed])

  return (
    <div className="flex h-full w-full bg-[#0b0a06] text-[#cdc6b0]">
      {/* Training log — reading surface */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-[#211c10] bg-[#120f08] px-4 py-2 text-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#e5c07b]" />
          <span className="font-semibold text-[#e5c07b]">train.py</span>
          <span className="text-[#6b5a2e]">
            run: {book.meta.title.split(' ')[0].toLowerCase()}-sft-v3 · ddp world_size=8
          </span>
          <span className="ml-auto tabular-nums text-[#6b5a2e]">{1843 + tick * 3} tok/s</span>
        </div>
        <div
          ref={areaRef}
          className="relative min-h-0 flex-1 overflow-hidden px-4 py-1"
          style={{ fontFamily: MONO_FONT, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px` }}
        >
          {logRows.map((r, i) => (
            <div key={i} className="flex whitespace-pre" style={{ height: LINE_H }}>
              <span className="text-[#6b5a2e]">{r.prefix} </span>
              {r.book && <span className="text-[#a98a3a]">sample ▸ </span>}
              <span className="overflow-hidden" style={{ color: r.book ? BOOK_INK : '#7a6a3e' }}>
                {r.msg}
              </span>
            </div>
          ))}
          <MonoProbe probeRef={probeRef} fontSize={FONT_SIZE} lineHeight={LINE_H} />
        </div>
        <div className="flex gap-4 border-t border-[#211c10] bg-[#120f08] px-4 py-1 text-[11px] text-[#6b5a2e]">
          <span className="text-[#a9c585]">✓ checkpoint saved</span>
          <span>amp=bf16</span>
          <span className="ml-auto tabular-nums">epoch progress {Math.round(progress * 100)}%</span>
        </div>
      </div>

      {/* Telemetry sidebar */}
      <div className="flex w-72 shrink-0 flex-col gap-3 border-l border-[#211c10] bg-[#0e0c07] p-3">
        <div className="rounded-lg border border-[#211c10] bg-[#120f08] p-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#6b5a2e]">train loss</span>
            <span className="text-sm font-semibold tabular-nums text-[#e06c75]">
              {curLoss.toFixed(4)}
            </span>
          </div>
          <Sparkline data={loss} color="#e06c75" width={240} height={56} fill strokeWidth={2} />
        </div>
        <div className="rounded-lg border border-[#211c10] bg-[#120f08] p-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#6b5a2e]">val accuracy</span>
            <span className="text-sm font-semibold tabular-nums text-[#a9c585]">
              {(curAcc * 100).toFixed(1)}%
            </span>
          </div>
          <Sparkline data={acc} color="#a9c585" width={240} height={56} fill strokeWidth={2} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="GPU 0" value={`${Math.round(gpu0[gpu0.length - 1])}%`} color="#e5c07b" />
          <Stat label="GPU 1" value={`${Math.round(gpu1[gpu1.length - 1])}%`} color="#e5c07b" />
          <Stat label="GPU 0 temp" value={`${68 + (tick % 6)}°C`} color="#e06c75" />
          <Stat label="VRAM" value="18.4/24G" color="#61afef" />
        </div>

        <div className="rounded-lg border border-[#211c10] bg-[#120f08] p-3">
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-[#6b5a2e]">
            <span>epoch {epoch}/52</span>
            <span className="tabular-nums">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#211c10]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#a98a3a] to-[#e5c07b] transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-[#6b5a2e]">ETA 02:14:08 · steps 3.4k/12k</div>
        </div>
      </div>
    </div>
  )
}
