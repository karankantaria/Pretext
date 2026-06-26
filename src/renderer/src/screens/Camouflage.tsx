// Screen 2 — Pick camouflage. The wardrobe, grouped by profession. A filter
// chip bar narrows to one role; each group lists its skins. Empty categories
// show a roadmap teaser.

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { BookView } from '../../../shared/types'
import { useApp } from '../store/appStore'
import { CATEGORIES, SKINS } from '../skins'
import SkinThumbnail from '../skins/SkinThumbnail'
import type { SkinDef } from '../skins/types'

const TEASERS: Record<string, string> = {
  creative: 'Vector editor (Illustrator/Figma), Photoshop & video timeline'
}

function SkinCard({
  skin,
  book,
  onPick
}: {
  skin: SkinDef
  book: BookView | null
  onPick: () => void
}): React.JSX.Element {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      disabled={!skin.available}
      onClick={() => skin.available && onPick()}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
        skin.available
          ? 'cursor-pointer border-[#1b2230] bg-[#0d1117] hover:border-[var(--a)] hover:shadow-[0_0_30px_-10px_var(--a)]'
          : 'cursor-not-allowed border-[#141a24] bg-[#0b0f15] opacity-50'
      }`}
      style={{ ['--a' as string]: skin.accent }}
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#1b2230]"
        style={{ background: `linear-gradient(135deg, ${skin.accent}22, transparent 70%)` }}
      >
        {skin.Component ? (
          <SkinThumbnail
            skin={skin}
            title={book?.title ?? 'Selected Book'}
            author={book?.author ?? 'Unknown author'}
            chapterCount={book?.chapterCount ?? 12}
          />
        ) : (
          <div className="absolute inset-0 p-3 font-mono text-[9px] leading-[13px] text-[#5c6370]">
            {Array.from({ length: 6 }).map((_, r) => (
              <div key={r} className="truncate" style={{ opacity: 1 - r * 0.12 }}>
                <span style={{ color: skin.accent }}>{r % 2 ? '›' : '▸'}</span> {'░▒▓█'.repeat(3)}{' '}
                {skin.id}_{r}
              </div>
            ))}
          </div>
        )}
        {/* Keep the hover glow readable over the busy preview. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1117]/40 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: skin.accent }} />
          <span className="text-sm font-semibold text-[#c8ccd4]">{skin.name}</span>
        </div>
        <div className="text-xs text-[#7d8694]">{skin.tagline}</div>
        <div className="mt-auto pt-2 text-[10px] text-[#3b4252]">{skin.disguise}</div>
      </div>
    </motion.button>
  )
}

export default function Camouflage(): React.JSX.Element {
  const { bookId, startReading, goLibrary } = useApp()
  const [book, setBook] = useState<BookView | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    window.api.library.list().then((list) => {
      setBook(list.find((b) => b.id === bookId) ?? null)
    })
  }, [bookId])

  const visibleCats = useMemo(
    () => CATEGORIES.filter((c) => filter === 'all' || c.id === filter),
    [filter]
  )

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0e14] text-[#c8ccd4]">
      <div className="flex items-center gap-3 border-b border-[#1b2230] px-6 py-4">
        <button
          onClick={goLibrary}
          className="rounded-md border border-[#2b3650] bg-[#0d1117] px-3 py-1.5 text-xs text-[#7d8694] hover:text-[#c8ccd4]"
        >
          ← Library
        </button>
        <div className="text-sm">
          <span className="text-[#5c6370]">Disguise for </span>
          <span className="font-semibold text-[#c8ccd4]">{book?.title ?? '…'}</span>
        </div>
        <div className="ml-auto text-xs text-[#3b4252]">Choose a camouflage by role</div>
      </div>

      {/* Role filter chips */}
      <div className="flex flex-wrap gap-2 border-b border-[#10151d] px-6 py-3">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')} accent="#7d8694">
          All roles
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
            accent={c.accent}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      {/* Grouped sections */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {visibleCats.map((cat) => {
          const skins = SKINS.filter((s) => s.category === cat.id)
          return (
            <section key={cat.id} className="mb-8">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat.accent }} />
                <h2 className="text-sm font-semibold text-[#e6edf3]">{cat.label}</h2>
                <span className="text-xs text-[#5c6370]">{cat.blurb}</span>
                <span className="ml-auto text-xs text-[#3b4252]">{skins.length}</span>
              </div>
              {skins.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {skins.map((skin) => (
                    <SkinCard
                      key={skin.id}
                      skin={skin}
                      book={book}
                      onPick={() => startReading(skin.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#1b2230] px-5 py-6 text-xs text-[#3b4252]">
                  Coming soon — {TEASERS[cat.id] ?? 'more disguises'}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  accent,
  children
}: {
  active: boolean
  onClick: () => void
  accent: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? 'border-[var(--a)] bg-[var(--a)]/10 text-[#e6edf3]'
          : 'border-[#1b2230] text-[#7d8694] hover:border-[#2b3650] hover:text-[#c8ccd4]'
      }`}
      style={{ ['--a' as string]: accent }}
    >
      {children}
    </button>
  )
}
