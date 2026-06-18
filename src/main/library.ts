// Library + progress store. Persists a single JSON file in Electron's userData
// dir: the list of imported books, each with its reading position and optional
// manual shelf pin. Shelf is auto-derived from progress unless pinned.

import { createHash } from 'crypto'
import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { app } from 'electron'
import type { BookView, ReadingPosition, Shelf } from '../shared/types'
import { parseEpubMeta } from './epub'

/** When the last chapter is read past this fraction, auto-mark the book finished. */
const FINISH_THRESHOLD = 0.985

interface BookRecord {
  id: string
  filePath: string
  title: string
  author: string
  coverDataUrl?: string
  chapterCount: number
  addedAt: number
  lastReadAt?: number
  position: ReadingPosition | null
  /** Manual shelf pin; when set it overrides auto-categorization. */
  shelfPin: Shelf | null
  finished: boolean
}

interface LibraryFile {
  version: 1
  books: BookRecord[]
}

let cache: LibraryFile | null = null

function storePath(): string {
  return join(app.getPath('userData'), 'library.json')
}

function idFor(filePath: string): string {
  return createHash('sha1').update(filePath.toLowerCase()).digest('hex').slice(0, 16)
}

async function load(): Promise<LibraryFile> {
  if (cache) return cache
  try {
    const raw = await readFile(storePath(), 'utf-8')
    const parsed = JSON.parse(raw) as LibraryFile
    cache = { version: 1, books: parsed.books ?? [] }
  } catch {
    cache = { version: 1, books: [] }
  }
  return cache
}

async function persist(): Promise<void> {
  if (!cache) return
  const path = storePath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(cache, null, 2), 'utf-8')
}

function overallProgress(b: BookRecord): number {
  if (b.finished) return 1
  if (!b.position || b.chapterCount === 0) return 0
  const p = (b.position.chapterIndex + b.position.chapterFraction) / b.chapterCount
  return Math.min(1, Math.max(0, p))
}

function shelfOf(b: BookRecord): Shelf {
  if (b.shelfPin) return b.shelfPin
  if (b.finished) return 'finished'
  const started = b.position && (b.position.chapterIndex > 0 || b.position.chapterFraction > 0)
  return started ? 'started' : 'toread'
}

function toView(b: BookRecord): BookView {
  return {
    id: b.id,
    filePath: b.filePath,
    title: b.title,
    author: b.author,
    coverDataUrl: b.coverDataUrl,
    chapterCount: b.chapterCount,
    addedAt: b.addedAt,
    lastReadAt: b.lastReadAt,
    shelf: shelfOf(b),
    shelfPinned: b.shelfPin !== null,
    progress: overallProgress(b)
  }
}

/** Started shelf first (resume-friendly), then most-recently touched. */
function sortViews(views: BookView[]): BookView[] {
  const rank: Record<Shelf, number> = { started: 0, toread: 1, finished: 2 }
  return [...views].sort((a, b) => {
    if (rank[a.shelf] !== rank[b.shelf]) return rank[a.shelf] - rank[b.shelf]
    return (b.lastReadAt ?? b.addedAt) - (a.lastReadAt ?? a.addedAt)
  })
}

export async function listBooks(): Promise<BookView[]> {
  const lib = await load()
  return sortViews(lib.books.map(toView))
}

/** Import an EPUB by absolute path. Idempotent: re-adding updates metadata. */
export async function addBookByPath(filePath: string): Promise<BookView[]> {
  const lib = await load()
  const id = idFor(filePath)
  const meta = await parseEpubMeta(filePath)
  const existing = lib.books.find((b) => b.id === id)
  if (existing) {
    existing.title = meta.title
    existing.author = meta.author
    existing.coverDataUrl = meta.coverDataUrl
    existing.chapterCount = meta.chapterCount
  } else {
    lib.books.push({
      id,
      filePath,
      title: meta.title,
      author: meta.author,
      coverDataUrl: meta.coverDataUrl,
      chapterCount: meta.chapterCount,
      addedAt: Date.now(),
      position: null,
      shelfPin: null,
      finished: false
    })
  }
  await persist()
  return sortViews(lib.books.map(toView))
}

export async function removeBook(id: string): Promise<BookView[]> {
  const lib = await load()
  lib.books = lib.books.filter((b) => b.id !== id)
  await persist()
  return sortViews(lib.books.map(toView))
}

/** Pin a manual shelf, or pass null to revert to auto-categorization. */
export async function setShelf(id: string, shelf: Shelf | null): Promise<BookView[]> {
  const lib = await load()
  const book = lib.books.find((b) => b.id === id)
  if (book) {
    book.shelfPin = shelf
    if (shelf === 'finished') book.finished = true
    if (shelf === 'toread') {
      book.finished = false
      book.position = null
    }
    await persist()
  }
  return sortViews(lib.books.map(toView))
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  const lib = await load()
  return lib.books.find((b) => b.id === id)
}

/** Dev convenience: import any .epub files found in `dir` that aren't yet known. */
export async function seedFromDir(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir)
    const lib = await load()
    const known = new Set(lib.books.map((b) => b.id))
    for (const name of entries) {
      if (!name.toLowerCase().endsWith('.epub')) continue
      const filePath = join(dir, name)
      if (known.has(idFor(filePath))) continue
      await addBookByPath(filePath)
    }
  } catch {
    // No seed dir / unreadable — fine, the library just starts empty.
  }
}

export async function saveProgress(
  id: string,
  position: Omit<ReadingPosition, 'updatedAt'>
): Promise<void> {
  const lib = await load()
  const book = lib.books.find((b) => b.id === id)
  if (!book) return
  book.position = { ...position, updatedAt: Date.now() }
  book.lastReadAt = Date.now()
  // Auto-finish when the reader reaches the end of the last chapter.
  if (
    !book.shelfPin &&
    book.chapterCount > 0 &&
    position.chapterIndex >= book.chapterCount - 1 &&
    position.chapterFraction >= FINISH_THRESHOLD
  ) {
    book.finished = true
  }
  await persist()
}
