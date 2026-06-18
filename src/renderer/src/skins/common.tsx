// Shared building blocks for skins: a monospace text-area measurer (so every
// skin reports geometry to the reader engine identically), plus lightweight
// animation + chart helpers that keep the decoration "alive" on a timer.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from 'react'

export const MONO_FONT =
  "'JetBrains Mono','Cascadia Code',ui-monospace,'SF Mono',Menlo,Consolas,monospace"

/** Bright ink for the actual book text — kept high-contrast for readability. */
export const BOOK_INK = '#dde4ec'

export interface MonoDims {
  cols: number
  rows: number
}

/**
 * Measure how many monospace chars/lines fit in `areaRef`, recomputing on
 * resize. `probeRef` must point at a hidden 100-char span inside the area
 * (use <MonoProbe/>).
 */
export function useMonoMeasure(
  areaRef: RefObject<HTMLElement | null>,
  probeRef: RefObject<HTMLElement | null>,
  lineHeight: number
): MonoDims {
  const [dims, setDims] = useState<MonoDims>({ cols: 80, rows: 20 })
  useLayoutEffect(() => {
    const area = areaRef.current
    const probe = probeRef.current
    if (!area || !probe) return
    const measure = (): void => {
      // Divide by the probe's actual length so proportional fonts get their
      // average advance width, not a hardcoded 100.
      const charW = probe.getBoundingClientRect().width / (probe.textContent?.length || 100)
      const w = area.clientWidth
      const h = area.clientHeight
      if (!charW || !w || !h) return
      const cols = Math.max(10, Math.floor(w / charW))
      const rows = Math.max(1, Math.floor(h / lineHeight))
      setDims((prev) => (prev.cols === cols && prev.rows === rows ? prev : { cols, rows }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(area)
    return () => ro.disconnect()
  }, [areaRef, probeRef, lineHeight])
  return dims
}

/** A representative sample for measuring proportional fonts' average advance. */
export const PROSE_SAMPLE =
  'the quick brown fox jumps over the lazy dog and then a slow grey cat naps in warm sun'

export function MonoProbe({
  probeRef,
  fontSize,
  lineHeight,
  sample = 'M'.repeat(100),
  fontFamily = MONO_FONT,
  fontWeight
}: {
  probeRef: RefObject<HTMLSpanElement | null>
  fontSize: number
  lineHeight: number
  /** Override for proportional fonts (use PROSE_SAMPLE). */
  sample?: string
  fontFamily?: string
  fontWeight?: number
}): React.JSX.Element {
  return (
    <span
      ref={probeRef}
      aria-hidden
      className="invisible absolute left-0 top-0 whitespace-pre"
      style={{ fontFamily, fontSize, lineHeight: `${lineHeight}px`, fontWeight }}
    >
      {sample}
    </span>
  )
}

/** setInterval that always calls the latest callback. */
export function useInterval(cb: () => void, ms: number): void {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}

/** A monotonically increasing frame counter to drive ambient motion. */
export function useTicker(ms = 1000): number {
  const [t, setT] = useState(0)
  useInterval(() => setT((v) => v + 1), ms)
  return t
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** A drifting numeric series (random walk) for sparklines and live charts. */
export function useSeries(len: number, ms: number, base: number, amp: number): number[] {
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length: len }, (_, i) => base + Math.sin(i * 0.6) * amp * 0.4)
  )
  useInterval(() => {
    setData((d) => {
      const last = d[d.length - 1]
      const nextVal = clamp(last + (Math.random() - 0.5) * amp * 0.6, base - amp, base + amp)
      return [...d.slice(1), nextVal]
    })
  }, ms)
  return data
}

/** A value that monotonically descends (training loss vibe), with jitter. */
export function useDescending(len: number, ms: number, start = 1): number[] {
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length: len }, (_, i) => start * Math.exp(-i / (len * 0.5)))
  )
  useInterval(() => {
    setData((d) => {
      const last = d[d.length - 1]
      const next = clamp(last * (0.985 + Math.random() * 0.02), 0.02, start)
      return [...d.slice(1), next]
    })
  }, ms)
  return data
}

export function Sparkline({
  data,
  color,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
  fill = false
}: {
  data: number[]
  color: string
  width?: number
  height?: number
  strokeWidth?: number
  fill?: boolean
}): React.JSX.Element {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const rng = max - min || 1
  const pts = data.map(
    (v, i) =>
      `${(i / (data.length - 1)) * width},${height - ((v - min) / rng) * (height - 2) - 1}`
  )
  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && (
        <polygon
          points={`0,${height} ${pts.join(' ')} ${width},${height}`}
          fill={color}
          opacity={0.12}
        />
      )}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  )
}

/** Stable pseudo-random hash from a string — deterministic per-line decoration. */
export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function slugify(s: string): string {
  return (
    s
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'document'
  )
}

/** Pad/truncate a prefix to an exact column count so book text starts aligned. */
export function fixCols(s: string, cols: number): string {
  if (s.length > cols) return s.slice(0, cols)
  return s.padEnd(cols, ' ')
}

/** Two-digit zero-pad. */
export function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}
