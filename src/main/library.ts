// Library + progress store. Persists two JSON files in Electron's userData dir:
//   library.json — the book records (metadata + reading position + shelf pin).
//   covers.json  — id → base64 cover data URL, kept SEPARATE so the frequent
//                  progress autosaves only rewrite the small library file, not
//                  megabytes of embedded cover images on every page turn.
// Book ids are a hash of the file's *content*, so moving or renaming an .epub
// keeps its progress. Shelf is auto-derived from progress unless pinned.

import { createHash } from 'crypto'
import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { app } from 'electron'
import type { BookView, ReadingPosition, Shelf } from '../shared/types'
import { parseEpubMeta } from './epub'

const STORE_VERSION = 2

interface BookRecord {
  id: string
  filePath: string
  title: string
  author: string
  chapterCount: number
  addedAt: number
  lastReadAt?: number
  position: ReadingPosition | null
  /** Manual shelf pin; when set it overrides auto-categorization. */
  shelfPin: Shelf | null
  finished: boolean
}

interface LibraryFile {
  version: number
  books: BookRecord[]
}

/** id → base64 cover data URL. */
type CoverMap = Record<string, string>

let cache: LibraryFile | null = null
let covers: CoverMap | null = null

function storePath(): string {
  return join(app.getPath('userData'), 'library.json')
}

function coversPath(): string {
  return join(app.getPath('userData'), 'covers.json')
}

/** Content hash so a book keeps its identity (and progress) across moves/renames. */
async function idFor(filePath: string): Promise<string> {
  const buf = await readFile(filePath)
  return createHash('sha1').update(buf).digest('hex').slice(0, 16)
}

async function loadCovers(): Promise<CoverMap> {
  if (covers) return covers
  try {
    covers = JSON.parse(await readFile(coversPath(), 'utf-8')) as CoverMap
  } catch {
    covers = {}
  }
  return covers
}

async function load(): Promise<LibraryFile> {
  if (cache) return cache
  await loadCovers()
  try {
    const raw = await readFile(storePath(), 'utf-8')
    // Older stores embedded the cover on each record; tolerate that shape.
    const parsed = JSON.parse(raw) as {
      version?: number
      books?: (BookRecord & { coverDataUrl?: string })[]
    }
    const books = parsed.books ?? []
    cache = { version: parsed.version ?? 1, books }
    if (cache.version < STORE_VERSION) await migrate(books)
  } catch {
    cache = { version: STORE_VERSION, books: [] }
  }
  return cache
}

/**
 * One-time upgrade of a pre-v2 store: pull any inline covers out into the
 * separate cover map, and re-key records from the old path-based id to a
 * content hash so existing progress survives the switch.
 */
async function migrate(books: (BookRecord & { coverDataUrl?: string })[]): Promise<void> {
  const map = await loadCovers()
  const seen = new Set<string>()
  const out: BookRecord[] = []

  for (const b of books) {
    const inlineCover = b.coverDataUrl
    delete b.coverDataUrl

    let id = b.id
    try {
      id = await idFor(b.filePath) // re-key by content where the file is reachable
    } catch {
      // File missing/unreadable — keep the old id.
    }
    if (inlineCover) map[id] = inlineCover
    else if (id !== b.id && map[b.id]) {
      map[id] = map[b.id]
      delete map[b.id]
    }
    b.id = id

    if (seen.has(id)) continue // drop duplicates (same content at two paths)
    seen.add(id)
    out.push(b)
  }

  cache = { version: STORE_VERSION, books: out }
  await persist()
  await persistCovers()
}

async function persist(): Promise<void> {
  if (!cache) return
  const path = storePath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(cache, null, 2), 'utf-8')
}

async function persistCovers(): Promise<void> {
  if (!covers) return
  const path = coversPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(covers), 'utf-8')
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
    coverDataUrl: covers?.[b.id],
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
  const map = await loadCovers()
  const id = await idFor(filePath)
  const meta = await parseEpubMeta(filePath)

  if (meta.coverDataUrl) map[id] = meta.coverDataUrl
  else delete map[id]

  const existing = lib.books.find((b) => b.id === id)
  if (existing) {
    // Same content — refresh metadata and follow the file to its new location.
    existing.title = meta.title
    existing.author = meta.author
    existing.chapterCount = meta.chapterCount
    existing.filePath = filePath
  } else {
    lib.books.push({
      id,
      filePath,
      title: meta.title,
      author: meta.author,
      chapterCount: meta.chapterCount,
      addedAt: Date.now(),
      position: null,
      shelfPin: null,
      finished: false
    })
  }
  await persistCovers()
  await persist()
  return sortViews(lib.books.map(toView))
}

export async function removeBook(id: string): Promise<BookView[]> {
  const lib = await load()
  const map = await loadCovers()
  lib.books = lib.books.filter((b) => b.id !== id)
  delete map[id]
  await persistCovers()
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
      try {
        if (known.has(await idFor(filePath))) continue
        await addBookByPath(filePath)
      } catch {
        // Skip files that can't be hashed/parsed.
      }
    }
  } catch {
    // No seed dir / unreadable — fine, the library just starts empty.
  }
}

export async function saveProgress(
  id: string,
  position: Omit<ReadingPosition, 'updatedAt'>,
  atEnd: boolean
): Promise<void> {
  const lib = await load()
  const book = lib.books.find((b) => b.id === id)
  if (!book) return
  book.position = { ...position, updatedAt: Date.now() }
  book.lastReadAt = Date.now()
  // Auto-finish when the reader reports it reached the end of the book. We trust
  // the reader's own end-of-book signal rather than reconstructing it from a
  // fraction threshold + spine length (which breaks for single-page final
  // chapters and when empty spine documents were skipped during parsing).
  if (!book.shelfPin && atEnd) book.finished = true
  await persist()
}
