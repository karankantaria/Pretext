// A skin is a pure presentation layer: it receives the current page's book
// lines from the reader engine and arranges them inside its own decoration.
// It must report the geometry of its text area so the engine can paginate.

import type { ComponentType } from 'react'
import type { OpenedBook } from '../../../shared/types'
import type { PageGeometry } from '../reader/paginate'

export interface SkinProps {
  book: OpenedBook
  /** The current page's wrapped book lines (one string per visual row). */
  lines: string[]
  chapterTitle: string
  chapterIndex: number
  pageIndex: number
  totalPages: number
  /** Overall progress across the whole book, 0..1. */
  progress: number
  /** Call when the text-area geometry is measured or changes. */
  onGeometry: (geo: PageGeometry) => void
}

export interface SkinDef {
  id: string
  name: string
  /** Category id (see CATEGORIES) used to group the wardrobe by profession. */
  category: string
  /** One-line pitch shown in the camouflage gallery. */
  tagline: string
  /** What an onlooker reads it as. */
  disguise: string
  /** Tailwind-ish accent colour for the gallery card. */
  accent: string
  /** False = shown in the gallery as "coming soon", not yet selectable. */
  available: boolean
  Component?: ComponentType<SkinProps>
}
