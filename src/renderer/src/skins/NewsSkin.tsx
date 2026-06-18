// News Site skin (Media). A newspaper front page: masthead, section nav, a
// crawling breaking-news ticker, a markets widget and a "Most Read" rail. The
// book text is the lead article's body — proportional serif, like real news.

import { useEffect, useMemo, useRef } from 'react'
import { MonoProbe, PROSE_SAMPLE, useSeries, useMonoMeasure, useTicker } from './common'
import type { SkinProps } from './types'

const FONT_SIZE = 16
const LINE_H = 27
const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif"

const SECTIONS = ['World', 'Business', 'Technology', 'Politics', 'Science', 'Culture', 'Opinion', 'Sport']
const TICKER = [
  'Markets rally as central banks signal pause',
  'Summit reaches accord after marathon talks',
  'New telescope captures deepest image yet',
  'Tech giants face fresh antitrust scrutiny',
  'Record turnout expected in weekend vote'
]
const MOST_READ = [
  'The quiet revolution reshaping how cities move',
  'Inside the lab racing to rewrite the rules',
  'Why this quarter could define the decade',
  'A coastline transformed, one tide at a time',
  'The interview everyone is talking about'
]
const TICKERS = [
  { s: 'IDX', up: true },
  { s: 'TEC', up: true },
  { s: 'OIL', up: false },
  { s: 'GLD', up: true },
  { s: 'FX', up: false }
]

export default function NewsSkin(props: SkinProps): React.JSX.Element {
  const { lines, chapterTitle, chapterIndex, progress, onGeometry } = props
  const areaRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const { cols, rows } = useMonoMeasure(areaRef, probeRef, LINE_H)

  const columns = Math.max(20, cols - 2)
  const bookRows = rows
  useEffect(() => {
    onGeometry({ columns, rows: bookRows })
  }, [columns, bookRows, onGeometry])

  const tick = useTicker(1400)
  const market = useSeries(TICKERS.length, 1400, 100, 8)
  const section = SECTIONS[chapterIndex % SECTIONS.length]

  const para = useMemo(
    () => lines.map((line) => ({ line, empty: line.trim() === '' })),
    [lines]
  )

  return (
    <div className="flex h-full w-full flex-col bg-[#f7f5f0] text-[#1a1a1a]">
      {/* Masthead */}
      <div className="flex items-center gap-3 border-b-2 border-black bg-[#f7f5f0] px-5 py-2">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#c0392b]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c0392b]" />
          Live
        </span>
        <div className="flex-1 text-center">
          <div
            className="text-3xl font-black tracking-tight"
            style={{ fontFamily: SERIF, letterSpacing: '-0.02em' }}
          >
            The Meridian
          </div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-wider text-[#777]">
          <div>Late Edition</div>
          <div>Updated {tick % 60}m ago</div>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex items-center gap-4 border-b border-[#ccc] bg-white px-5 py-1.5 text-[12px] font-medium">
        {SECTIONS.map((s) => (
          <span key={s} className={s === section ? 'text-[#c0392b]' : 'text-[#333] hover:text-black'}>
            {s}
          </span>
        ))}
        <span className="ml-auto rounded-sm bg-black px-2 py-0.5 text-[11px] text-white">Subscribe</span>
      </div>

      {/* Breaking ticker */}
      <div className="flex items-center overflow-hidden border-b border-[#ccc] bg-[#c0392b] text-white">
        <span className="z-10 shrink-0 bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
          Breaking
        </span>
        <div className="relative flex-1 overflow-hidden whitespace-nowrap py-1">
          <div className="inline-block" style={{ animation: 'marquee 38s linear infinite' }}>
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="mx-6 text-[12px]">
                ● {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-6 px-6 py-4">
        {/* Lead article — reading surface */}
        <article className="flex min-w-0 flex-1 flex-col">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#c0392b]">
            {section}
          </div>
          <h1
            className="mt-1 text-[30px] font-bold leading-[34px]"
            style={{ fontFamily: SERIF, letterSpacing: '-0.01em' }}
          >
            {chapterTitle}
          </h1>
          <div className="mt-1 flex items-center gap-2 border-b border-[#ddd] pb-2 text-[12px] text-[#777]">
            <span className="text-[#333]">By Our Staff Correspondent</span>
            <span>·</span>
            <span>{6 + (chapterIndex % 9)} min read</span>
            <span>·</span>
            <span>Section {chapterIndex + 1}</span>
          </div>
          <div
            ref={areaRef}
            className="relative mt-3 min-h-0 flex-1 overflow-hidden"
            style={{ fontFamily: SERIF, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px`, color: '#222' }}
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
              fontFamily={SERIF}
            />
          </div>
        </article>

        {/* Sidebar */}
        <aside className="flex w-72 shrink-0 flex-col gap-4 border-l border-[#ddd] pl-5">
          <div>
            <div className="mb-2 border-b-2 border-black pb-1 text-[12px] font-bold uppercase tracking-wider">
              Markets
            </div>
            <div className="space-y-1">
              {TICKERS.map((t, i) => {
                const v = market[i]
                return (
                  <div key={t.s} className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold">{t.s}</span>
                    <span className="tabular-nums">{v.toFixed(2)}</span>
                    <span className={t.up ? 'text-[#1a7f37]' : 'text-[#c0392b]'}>
                      {t.up ? '▲' : '▼'} {(Math.abs(v - 100) + 0.1).toFixed(2)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 border-b-2 border-black pb-1 text-[12px] font-bold uppercase tracking-wider">
              Most Read
            </div>
            <ol className="space-y-2">
              {MOST_READ.map((m, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug">
                  <span className="font-bold text-[#c0392b]">{i + 1}</span>
                  <span style={{ fontFamily: SERIF }} className="text-[#333]">
                    {m}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-auto border border-dashed border-[#bbb] p-3 text-center text-[10px] uppercase tracking-widest text-[#aaa]">
            Advertisement
            <div className="mt-6 mb-6 text-[#ccc]">300 × 250</div>
          </div>
          <div className="text-right text-[10px] text-[#bbb]">{Math.round(progress * 100)}% read</div>
        </aside>
      </div>
    </div>
  )
}
