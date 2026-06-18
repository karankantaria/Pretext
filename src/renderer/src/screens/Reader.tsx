// Screen 3 — Read. Renders the chosen skin around the current page of book
// text from the reader engine. Keyboard + click navigation; Esc returns to the
// library (placeholder until panic mode lands).

import { useEffect } from 'react'
import { useApp } from '../store/appStore'
import { useReader } from '../reader/useReader'
import { getSkin } from '../skins'

export default function Reader(): React.JSX.Element {
  const { bookId, skinId, goLibrary } = useApp()
  const reader = useReader(bookId ?? '')
  const skin = getSkin(skinId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        reader.next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        reader.prev()
      } else if (e.key === 'Escape') {
        goLibrary()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reader, goLibrary])

  if (!bookId) {
    return <div className="flex h-full items-center justify-center text-[#5c6370]">No book</div>
  }

  if (reader.loading || !reader.book) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0e14] text-[#5c6370]">
        <span className="animate-pulse">initializing…</span>
      </div>
    )
  }

  if (!skin?.Component) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0e14] text-[#e06c75]">
        Unknown skin: {skinId}
      </div>
    )
  }

  const Skin = skin.Component
  const chapterTitle = reader.book.chapters[reader.chapterIndex]?.title ?? ''

  return (
    <div className="relative h-full w-full">
      <Skin
        book={reader.book}
        lines={reader.lines}
        chapterTitle={chapterTitle}
        chapterIndex={reader.chapterIndex}
        pageIndex={reader.pageIndex}
        totalPages={reader.totalPages}
        progress={reader.progress}
        onGeometry={reader.setGeometry}
      />

      {/* Invisible click zones: left third = prev, right two-thirds = next. */}
      <div className="absolute inset-y-0 left-0 w-1/3 cursor-default" onClick={reader.prev} />
      <div className="absolute inset-y-0 right-0 w-2/3 cursor-default" onClick={reader.next} />
    </div>
  )
}
