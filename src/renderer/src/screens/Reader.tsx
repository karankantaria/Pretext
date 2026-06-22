// Screen 3 — Read. Renders the chosen skin around the current page of book text
// from the reader engine. Keyboard + click navigation, a discreet exit, and a
// hover/keyboard reader menu (table of contents + text size).

import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store/appStore'
import { useReader } from '../reader/useReader'
import ReaderMenu from '../reader/ReaderMenu'
import DictionaryModal from '../reader/DictionaryModal'
import { getSkin } from '../skins'

export default function Reader(): React.JSX.Element {
  const { bookId, skinId, goLibrary, panic, fontScale, setFontScale } = useApp()
  const reader = useReader(bookId ?? '')
  const skin = getSkin(skinId)
  const [menuOpen, setMenuOpen] = useState(false)
  // null = closed; a string seeds the lookup field (with any selected word).
  const [dictWord, setDictWord] = useState<string | null>(null)

  const openDict = (): void => {
    const sel = (window.getSelection()?.toString() ?? '').trim().split(/\s+/)[0] ?? ''
    setMenuOpen(false)
    setDictWord(sel)
  }

  // Click-to-turn is debounced so a double-click (word lookup) doesn't also
  // flip the page out from under the word being selected.
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (clickTimer.current) clearTimeout(clickTimer.current)
    },
    []
  )

  const cancelPendingTurn = (): void => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
  }

  const onReadClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (panic || menuOpen || dictWord !== null) return
    if (e.detail > 1) {
      cancelPendingTurn() // second click of a double-click — don't turn the page
      return
    }
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && sel.toString().trim()) return // user is selecting text
    const rect = e.currentTarget.getBoundingClientRect()
    const goPrev = e.clientX - rect.left < rect.width / 3
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      if (goPrev) reader.prev()
      else reader.next()
    }, 200)
  }

  const onReadDoubleClick = (): void => {
    cancelPendingTurn()
    const word = (window.getSelection()?.toString() ?? '').trim().split(/\s+/)[0] ?? ''
    if (word) {
      setMenuOpen(false)
      setDictWord(word)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (panic) return // nothing should fire under the panic cover
      if (dictWord !== null) return // the dictionary modal owns the keyboard
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
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        openDict()
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
  }, [reader, goLibrary, panic, menuOpen, dictWord, fontScale, setFontScale])

  if (!bookId) {
    return <div className="flex h-full items-center justify-center text-[#5c6370]">No book</div>
  }

  if (reader.error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#0a0e14] px-6 text-center">
        <div className="text-sm text-[#e06c75]">This book couldn’t be opened.</div>
        <div className="max-w-md text-xs text-[#5c6370]">{reader.error}</div>
        <button
          onClick={goLibrary}
          className="rounded-md border border-[#2b3650] bg-[#0d1117] px-4 py-1.5 text-xs font-medium text-[#c8ccd4] transition-colors hover:border-brand/60 hover:text-brand"
        >
          ← Back to library
        </button>
      </div>
    )
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
    <div className="relative h-full w-full" onClick={onReadClick} onDoubleClick={onReadDoubleClick}>
      {/* Click the left third to go back, the rest to advance; book text stays
          selectable, and double-clicking a word looks it up. */}
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
          onLookup={openDict}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {dictWord !== null && (
        <DictionaryModal initialWord={dictWord} onClose={() => setDictWord(null)} />
      )}
    </div>
  )
}
