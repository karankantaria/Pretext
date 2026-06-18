// useReader: the stateful core of the reading screen. Loads a book, paginates
// the current chapter to the active skin's geometry, restores the saved spot by
// fraction (resize-proof), exposes next/prev/jump, and autosaves position.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { OpenedBook } from '../../../shared/types'
import {
  fractionForPage,
  pageFromFraction,
  paginateChapter,
  type PageGeometry
} from './paginate'

export interface ReaderApi {
  loading: boolean
  book: OpenedBook | null
  chapterIndex: number
  pageIndex: number
  totalPages: number
  /** The current page's wrapped book lines — what a skin renders. */
  lines: string[]
  /** Overall progress across the whole book, 0..1. */
  progress: number
  atStart: boolean
  atEnd: boolean
  next: () => void
  prev: () => void
  jumpChapter: (i: number) => void
  /** A skin reports its measured text-area geometry here. */
  setGeometry: (geo: PageGeometry) => void
}

const SAVE_DEBOUNCE_MS = 700

export function useReader(bookId: string): ReaderApi {
  const [book, setBook] = useState<OpenedBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [chapterIndex, setChapterIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [geo, setGeo] = useState<PageGeometry | null>(null)

  // The chapter fraction we want to preserve across re-paginations (resize,
  // chapter changes, initial restore).
  const targetFraction = useRef(0)
  // Becomes true only after the book is loaded, paginated, and the saved spot
  // restored. Guards autosave so React StrictMode's mount→unmount→remount in
  // dev can't clobber the stored position with an initial (0, 0).
  const ready = useRef(false)

  // Load the book and seed the starting chapter + fraction from saved position.
  useEffect(() => {
    let alive = true
    setLoading(true)
    ready.current = false
    window.api.book.open(bookId).then((b) => {
      if (!alive) return
      setBook(b)
      const pos = b.position
      const ci = pos ? Math.min(Math.max(0, pos.chapterIndex), Math.max(0, b.chapters.length - 1)) : 0
      targetFraction.current = pos ? pos.chapterFraction : 0
      setChapterIndex(ci)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [bookId])

  const pages = useMemo<string[][]>(() => {
    if (!book || !geo) return [[]]
    const text = book.chapters[chapterIndex]?.text ?? ''
    return paginateChapter(text, geo)
  }, [book, geo, chapterIndex])

  const totalPages = pages.length

  // Whenever pagination changes (geometry or chapter), land on the page that
  // matches the preserved fraction. Once we've restored against real geometry,
  // saving is safe.
  useEffect(() => {
    setPageIndex(pageFromFraction(targetFraction.current, totalPages))
    if (book && geo) ready.current = true
  }, [pages, totalPages, book, geo])

  const setGeometry = useCallback((next: PageGeometry) => {
    setGeo((prev) =>
      prev && prev.columns === next.columns && prev.rows === next.rows ? prev : next
    )
  }, [])

  const chapterCount = book?.chapters.length ?? 0
  const atStart = chapterIndex === 0 && pageIndex === 0
  const atEnd = chapterIndex >= chapterCount - 1 && pageIndex >= totalPages - 1

  const next = useCallback(() => {
    if (!book) return
    if (pageIndex < totalPages - 1) {
      const np = pageIndex + 1
      targetFraction.current = fractionForPage(np, totalPages)
      setPageIndex(np)
    } else if (chapterIndex < book.chapters.length - 1) {
      targetFraction.current = 0
      setChapterIndex(chapterIndex + 1)
    }
  }, [book, pageIndex, totalPages, chapterIndex])

  const prev = useCallback(() => {
    if (!book) return
    if (pageIndex > 0) {
      const np = pageIndex - 1
      targetFraction.current = fractionForPage(np, totalPages)
      setPageIndex(np)
    } else if (chapterIndex > 0) {
      targetFraction.current = 1 // land on the last page of the previous chapter
      setChapterIndex(chapterIndex - 1)
    }
  }, [book, pageIndex, totalPages, chapterIndex])

  const jumpChapter = useCallback(
    (i: number) => {
      if (!book) return
      const ci = Math.max(0, Math.min(book.chapters.length - 1, i))
      targetFraction.current = 0
      setChapterIndex(ci)
    },
    [book]
  )

  const chapterFraction = fractionForPage(pageIndex, totalPages)
  const progress = chapterCount > 0 ? (chapterIndex + chapterFraction) / chapterCount : 0

  // Debounced autosave of the current position, plus a flush on unmount.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef({ chapterIndex, chapterFraction })
  latest.current = { chapterIndex, chapterFraction }

  useEffect(() => {
    if (!book || !geo || !ready.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.api.progress.save(bookId, {
        chapterIndex: latest.current.chapterIndex,
        chapterFraction: latest.current.chapterFraction
      })
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [bookId, book, geo, chapterIndex, chapterFraction])

  useEffect(() => {
    return () => {
      // Final flush so the exact spot survives leaving the reader — but only if
      // we actually got far enough to have a real position to save.
      if (!ready.current) return
      window.api.progress.save(bookId, {
        chapterIndex: latest.current.chapterIndex,
        chapterFraction: latest.current.chapterFraction
      })
    }
  }, [bookId])

  return {
    loading,
    book,
    chapterIndex,
    pageIndex,
    totalPages,
    lines: pages[pageIndex] ?? [],
    progress,
    atStart,
    atEnd,
    next,
    prev,
    jumpChapter,
    setGeometry
  }
}
