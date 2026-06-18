// Screen 1 — Library home. Three auto-sorted shelves (Started / To Read /
// Finished), each book resumable in one click. Light dashboard styling; the
// real disguise begins once a book is opened.

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { BookView, Shelf } from '../../../shared/types'
import { useApp } from '../store/appStore'

const SHELVES: { key: Shelf; label: string; hint: string }[] = [
  { key: 'started', label: 'In Progress', hint: 'Pick up where you left off' },
  { key: 'toread', label: 'Queue', hint: 'Imported, not yet opened' },
  { key: 'finished', label: 'Archived', hint: 'Completed' }
]

function BookCard({
  book,
  onOpen,
  onSetShelf,
  onRemove
}: {
  book: BookView
  onOpen: () => void
  onSetShelf: (shelf: Shelf | null) => void
  onRemove: () => void
}): React.JSX.Element {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex gap-3 rounded-lg border border-[#1b2230] bg-[#0d1117] p-3 transition-colors hover:border-[#2b3650]"
    >
      <button onClick={onOpen} className="flex flex-1 gap-3 text-left">
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-[#161b22]">
          {book.coverDataUrl ? (
            <img src={book.coverDataUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#3b4252]">
              {'{ }'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#c8ccd4]">{book.title}</div>
          <div className="truncate text-xs text-[#5c6370]">{book.author}</div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#161b22]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
              style={{ width: `${Math.round(book.progress * 100)}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-[#5c6370]">
            {book.progress > 0 ? `${Math.round(book.progress * 100)}% · ` : ''}
            {book.chapterCount} sections
          </div>
        </div>
      </button>

      {/* Hover controls: move shelf / remove */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <select
          value={book.shelfPinned ? book.shelf : 'auto'}
          onChange={(e) =>
            onSetShelf(e.target.value === 'auto' ? null : (e.target.value as Shelf))
          }
          title="Move to shelf"
          className="rounded border border-[#2b3650] bg-[#0a0e14] px-1 py-0.5 text-[10px] text-[#7d8694]"
        >
          <option value="auto">Auto</option>
          <option value="started">In Progress</option>
          <option value="toread">Queue</option>
          <option value="finished">Archived</option>
        </select>
        <button
          onClick={onRemove}
          title="Remove"
          className="rounded border border-[#2b3650] bg-[#0a0e14] px-1.5 py-0.5 text-[10px] text-[#e06c75]"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}

export default function Library(): React.JSX.Element {
  const { pickBook } = useApp()
  const [books, setBooks] = useState<BookView[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const list = await window.api.library.list()
    setBooks(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addBooks = useCallback(async () => {
    const list = await window.api.library.add()
    setBooks(list)
  }, [])

  const setShelf = useCallback(async (id: string, shelf: Shelf | null) => {
    setBooks(await window.api.library.setShelf(id, shelf))
  }, [])

  const remove = useCallback(async (id: string) => {
    setBooks(await window.api.library.remove(id))
  }, [])

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0e14] text-[#c8ccd4]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#1b2230] px-6 py-4">
        <div className="text-lg font-bold tracking-tight">
          <span className="bg-gradient-to-r from-emerald-300 to-sky-400 bg-clip-text text-transparent">
            Pretext
          </span>
        </div>
        <div className="text-xs text-[#5c6370]">workspace · {books.length} modules</div>
        <button
          onClick={addBooks}
          className="ml-auto rounded-md border border-[#2b3650] bg-[#0d1117] px-3 py-1.5 text-xs font-medium text-[#c8ccd4] transition-colors hover:border-emerald-500/60 hover:text-emerald-300"
        >
          + Import
        </button>
      </div>

      {/* Shelves */}
      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden p-6">
        {SHELVES.map((shelf) => {
          const shelfBooks = books.filter((b) => b.shelf === shelf.key)
          return (
            <div key={shelf.key} className="flex min-h-0 flex-col">
              <div className="mb-1 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-[#c8ccd4]">{shelf.label}</h2>
                <span className="text-xs text-[#3b4252]">{shelfBooks.length}</span>
              </div>
              <div className="mb-3 text-[10px] uppercase tracking-wider text-[#3b4252]">
                {shelf.hint}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                {shelfBooks.map((b) => (
                  <BookCard
                    key={b.id}
                    book={b}
                    onOpen={() => pickBook(b.id)}
                    onSetShelf={(s) => setShelf(b.id, s)}
                    onRemove={() => remove(b.id)}
                  />
                ))}
                {!loading && shelfBooks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#1b2230] p-6 text-center text-xs text-[#3b4252]">
                    empty
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
