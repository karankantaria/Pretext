// A live wardrobe thumbnail: renders the real skin at a fixed "design" size and
// CSS-scales it to fit the card, so each preview is the actual animated skin in
// miniature (not a mock). Fed sample prose + the chosen book's title so the
// disguise reads true. Purely decorative — pointer events pass through to the card.

import { useLayoutEffect, useRef, useState } from 'react'
import type { OpenedBook } from '../../../shared/types'
import type { SkinDef } from './types'

// Render the skin at a full window size, then scale the whole thing down.
const DESIGN_W = 1280
const DESIGN_H = 800

// A page of generic prose to sit inside the disguise. Pre-wrapped, one row each.
const SAMPLE_LINES = [
  'The harbour had gone quiet by the time she reached the last pier,',
  'and the lamps along the water were just beginning to find their',
  'reflections. She had walked this stretch a hundred times before,',
  'but never so late, and never with the letter folded in her pocket.',
  '',
  'It was not the words that troubled her so much as the handwriting —',
  'careful, deliberate, the way a person writes when they already know',
  'they will not be answered. She had read it twice on the train and',
  'once more under the awning where the rain had caught her.',
  '',
  'Somewhere out past the breakwater a bell was ringing, slow and even,',
  'marking nothing in particular. She let it keep time for her thoughts.',
  'Tomorrow the office would open as it always did, the screens would',
  'flicker awake, and no one would ask where she had been the night',
  'before, or why she looked as though she had decided something.',
  '',
  'For now there was only the cold rail under her hands, the dark',
  'shifting water, and the patient, distant ringing of the bell.'
]

export default function SkinThumbnail({
  skin,
  title,
  author,
  chapterCount
}: {
  skin: SkinDef
  title: string
  author: string
  chapterCount: number
}): React.JSX.Element | null {
  const Comp = skin.Component
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)

  // Scale the design-size skin to whatever width the card gives us.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = (): void => {
      const w = el.clientWidth
      if (w) setScale(w / DESIGN_W)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!Comp) return null

  const sampleBook: OpenedBook = {
    id: 'preview',
    meta: { title, author, chapterCount },
    chapters: [{ title: 'Chapter One', text: SAMPLE_LINES.join('\n') }],
    position: null
  }

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        <Comp
          book={sampleBook}
          lines={SAMPLE_LINES}
          chapterTitle="Chapter One"
          chapterIndex={0}
          pageIndex={1}
          totalPages={14}
          progress={0.42}
          fontScale={1}
          onGeometry={() => {}}
        />
      </div>
    </div>
  )
}
