// Screen 3 — Read. Renders the chosen skin around the current page of book text
// from the reader engine. Keyboard + click navigation, a discreet exit, and a
// hover/keyboard reader menu (table of contents + text size).

import { useEffect, useState } from 'react'
import { useApp } from '../store/appStore'
import { useReader } from '../reader/useReader'
import ReaderMenu from '../reader/ReaderMenu'
import { getSkin } from '../skins'

export default function Reader(): React.JSX.Element {
  const { bookId, skinId, goLibrary, panic, fontScale, setFontScale } = useApp()
  const reader = useReader(bookId ?? '')
  const skin = getSkin(skinId)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (panic) return // nothing should fire under the panic cover
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setMenuOpen((o) => !o)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setFontScale(fontScale - 0.1)
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setFontScale(fontScale + 0.1)
      } else if (menuOpen) {
        return // while the menu is open, don't turn pages
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        reader.next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        reader.prev()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        goLibrary()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reader, goLibrary, panic, menuOpen, fontScale, setFontScale])

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
        fontScale={fontScale}
        onGeometry={reader.setGeometry}
      />

      {/* Invisible click zones: left third = prev, right two-thirds = next. */}
      <div className="absolute inset-y-0 left-0 w-1/3 cursor-default" onClick={reader.prev} />
      <div className="absolute inset-y-0 right-0 w-2/3 cursor-default" onClick={reader.next} />

      {/* Discreet exit: a faint back button revealed only on hover (top-left). */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          goLibrary()
        }}
        title="Back to library (Backspace)"
        className="absolute left-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-md bg-black/30 text-sm text-white/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/50 hover:opacity-100"
      >
        ←
      </button>

      {/* Discreet contents/settings: a faint menu button revealed on hover (top-right). */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen(true)
        }}
        title="Contents & text size (c)"
        className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-md bg-black/30 text-sm text-white/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/50 hover:opacity-100"
      >
        ☰
      </button>

      {menuOpen && (
        <ReaderMenu
          book={reader.book}
          currentIndex={reader.chapterIndex}
          progress={reader.progress}
          fontScale={fontScale}
          onJump={reader.jumpChapter}
          onSetFontScale={setFontScale}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
