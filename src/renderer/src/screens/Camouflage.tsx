// Screen 2 — Pick camouflage. A gallery of skins (the "wardrobe"). Available
// skins are selectable; the rest preview as coming soon.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { BookView } from '../../../shared/types'
import { useApp } from '../store/appStore'
import { SKINS } from '../skins'

export default function Camouflage(): React.JSX.Element {
  const { bookId, startReading, goLibrary } = useApp()
  const [book, setBook] = useState<BookView | null>(null)

  useEffect(() => {
    window.api.library.list().then((list) => {
      setBook(list.find((b) => b.id === bookId) ?? null)
    })
  }, [bookId])

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
        <div className="ml-auto text-xs text-[#3b4252]">Choose a camouflage</div>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-4 overflow-y-auto p-6">
        {SKINS.map((skin, i) => (
          <motion.button
            key={skin.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            disabled={!skin.available}
            onClick={() => skin.available && startReading(skin.id)}
            className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
              skin.available
                ? 'cursor-pointer border-[#1b2230] bg-[#0d1117] hover:border-[var(--a)] hover:shadow-[0_0_30px_-10px_var(--a)]'
                : 'cursor-not-allowed border-[#141a24] bg-[#0b0f15] opacity-50'
            }`}
            style={{ ['--a' as string]: skin.accent }}
          >
            {/* Mini preview band */}
            <div
              className="relative h-28 w-full overflow-hidden border-b border-[#1b2230]"
              style={{
                background: `linear-gradient(135deg, ${skin.accent}22, transparent 70%)`
              }}
            >
              <div className="absolute inset-0 p-3 font-mono text-[9px] leading-[13px] text-[#5c6370]">
                {Array.from({ length: 7 }).map((_, r) => (
                  <div key={r} className="truncate" style={{ opacity: 1 - r * 0.1 }}>
                    <span style={{ color: skin.accent }}>{r % 2 ? '›' : '▸'}</span>{' '}
                    {'░▒▓█'.repeat(3)} {skin.id}_{r}
                  </div>
                ))}
              </div>
              {!skin.available && (
                <div className="absolute right-2 top-2 rounded bg-[#0a0e14]/80 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#5c6370]">
                  soon
                </div>
              )}
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
        ))}
      </div>
    </div>
  )
}
