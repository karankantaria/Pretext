// Shared types — the contract between the main and renderer processes.
// Imported by both; keep it free of any node/electron/dom imports.

export type Shelf = 'started' | 'toread' | 'finished'

/** One chapter of a parsed book: a title and the clean, stripped prose. */
export interface Chapter {
  title: string
  /** Paragraph-separated plain text (paragraphs split by a blank line). */
  text: string
}

/** Lightweight metadata used to render the library, without chapter content. */
export interface BookMeta {
  title: string
  author: string
  /** base64 data URL of the cover image, if one was found. */
  coverDataUrl?: string
  chapterCount: number
}

/** A book as the renderer sees it on the library screen. */
export interface BookView extends BookMeta {
  id: string
  filePath: string
  addedAt: number
  lastReadAt?: number
  /** Effective shelf (manual override wins, else auto-derived). */
  shelf: Shelf
  /** True when the shelf was set manually rather than auto-derived. */
  shelfPinned: boolean
  /** Overall reading progress across the whole book, 0..1. */
  progress: number
}

/** Where the reader left off, stored resize-proof as a fraction of a chapter. */
export interface ReadingPosition {
  chapterIndex: number
  /** 0..1 position within that chapter. */
  chapterFraction: number
  updatedAt: number
}

/** Full payload returned when a book is opened for reading. */
export interface OpenedBook {
  id: string
  meta: BookMeta
  chapters: Chapter[]
  position: ReadingPosition | null
}

/** One sense from a dictionary lookup. */
export interface DictSense {
  partOfSpeech: string
  definition: string
  example?: string
}

/** A normalized dictionary entry (subset of dictionaryapi.dev's response). */
export interface DictEntry {
  word: string
  phonetic?: string
  senses: DictSense[]
}

/** The API surface exposed on `window.api` via the preload bridge. */
export interface PretextApi {
  library: {
    list: () => Promise<BookView[]>
    /** Open a file picker, import the chosen EPUB(s), return the updated list. */
    add: () => Promise<BookView[]>
    /** Import a specific EPUB by absolute path (used to seed test books). */
    addPath: (filePath: string) => Promise<BookView[]>
    remove: (id: string) => Promise<BookView[]>
    /** Pin a manual shelf, or pass null to revert to auto-categorization. */
    setShelf: (id: string, shelf: Shelf | null) => Promise<BookView[]>
  }
  book: {
    open: (id: string) => Promise<OpenedBook>
  }
  progress: {
    /** Save the current spot. `atEnd` marks the book finished (end of the last chapter). */
    save: (
      id: string,
      position: Omit<ReadingPosition, 'updatedAt'>,
      atEnd: boolean
    ) => Promise<void>
  }
  dictionary: {
    /** Look up a word; resolves null when there's no definition. */
    lookup: (word: string) => Promise<DictEntry | null>
  }
  /** Subscribe to the global panic hotkey (fires even when unfocused). Returns an unsubscribe fn. */
  onPanic: (cb: () => void) => () => void
}

/** IPC channel names — single source of truth for main + preload. */
export const IPC = {
  libraryList: 'library:list',
  libraryAdd: 'library:add',
  libraryAddPath: 'library:addPath',
  libraryRemove: 'library:remove',
  librarySetShelf: 'library:setShelf',
  bookOpen: 'book:open',
  progressSave: 'progress:save',
  dictLookup: 'dict:lookup',
  panicTrigger: 'panic:trigger'
} as const
