// The shared reader engine: pure functions that turn a chapter's prose into a
// list of wrapped lines, then into fixed-height pages. Every skin consumes the
// output; none of them re-implement reading logic.

export interface PageGeometry {
  /** Characters that fit on one line of the skin's text area. */
  columns: number
  /** Lines of book text that fit on one page. */
  rows: number
}

/** Greedy word-wrap a paragraph to `columns`, hard-splitting over-long words. */
export function wrapParagraph(text: string, columns: number): string[] {
  const cols = Math.max(1, columns)
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let cur = ''

  const pushLong = (w: string): void => {
    let s = w
    while (s.length > cols) {
      lines.push(s.slice(0, cols))
      s = s.slice(cols)
    }
    cur = s
  }

  for (const w of words) {
    if (cur === '') {
      if (w.length > cols) pushLong(w)
      else cur = w
    } else if (cur.length + 1 + w.length <= cols) {
      cur += ' ' + w
    } else {
      lines.push(cur)
      if (w.length > cols) {
        cur = ''
        pushLong(w)
      } else {
        cur = w
      }
    }
  }
  if (cur !== '') lines.push(cur)
  return lines
}

/** Flatten a chapter into wrapped display lines, blank line between paragraphs. */
export function chapterToLines(text: string, columns: number): string[] {
  const out: string[] = []
  for (const para of text.split(/\n{2,}/)) {
    const t = para.replace(/\n/g, ' ').trim()
    if (!t) continue
    out.push(...wrapParagraph(t, columns))
    out.push('') // paragraph gap
  }
  if (out.length && out[out.length - 1] === '') out.pop()
  return out
}

/** Slice a flat line list into pages of `rows` lines each. */
export function paginateLines(lines: string[], rows: number): string[][] {
  const r = Math.max(1, rows)
  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += r) pages.push(lines.slice(i, i + r))
  return pages.length ? pages : [[]]
}

export function paginateChapter(text: string, geo: PageGeometry): string[][] {
  return paginateLines(chapterToLines(text, geo.columns), geo.rows)
}

/** Fraction (0..1) of a chapter at a given page; inverse of pageFromFraction. */
export function fractionForPage(page: number, totalPages: number): number {
  return totalPages > 1 ? page / (totalPages - 1) : 0
}

export function pageFromFraction(fraction: number, totalPages: number): number {
  if (totalPages <= 1) return 0
  return Math.max(0, Math.min(totalPages - 1, Math.round(fraction * (totalPages - 1))))
}
