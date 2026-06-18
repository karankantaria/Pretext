// EPUB parsing: unzip → resolve the OPF → walk the spine → strip HTML to clean
// prose. Two entry points: `parseEpubMeta` (fast, for the library) and
// `parseEpubChapters` (full content, for reading).

import { readFile } from 'fs/promises'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import { parse as parseHtml } from 'node-html-parser'
import type { BookMeta, Chapter } from '../shared/types'

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Keep tag names verbatim (we rely on dc: prefixes etc.).
  removeNSPrefix: false,
  // Decode named + numeric HTML entities in text (e.g. &#xe6; in NCX titles).
  htmlEntities: true
})

/** Coerce fast-xml-parser's "single child = object, many = array" into an array. */
function toArray<T>(v: unknown): T[] {
  if (v == null) return []
  return (Array.isArray(v) ? v : [v]) as T[]
}

/** Extract text from an fxp node that may be a string, or an object with #text. */
function textOf(node: unknown): string {
  if (node == null) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return textOf(node[0])
  if (typeof node === 'object') {
    const t = (node as Record<string, unknown>)['#text']
    return t == null ? '' : String(t)
  }
  return ''
}

/** Resolve an EPUB href (relative to the OPF dir), normalizing `.`/`..` and decoding. */
function resolvePath(baseDir: string, href: string): string {
  const clean = decodeURIComponent(href.split('#')[0].trim())
  const stack = baseDir ? baseDir.split('/').filter(Boolean) : []
  for (const part of clean.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return stack.join('/')
}

function dirOf(path: string): string {
  const i = path.lastIndexOf('/')
  return i === -1 ? '' : path.slice(0, i)
}

interface OpfContext {
  zip: JSZip
  opfDir: string
  metadata: Record<string, unknown>
  /** manifest id → { href (resolved), mediaType, properties } */
  manifest: Map<string, { href: string; mediaType: string; properties: string }>
  /** ordered list of resolved hrefs from the spine */
  spineHrefs: string[]
  ncxHref: string | null
}

async function loadZip(filePath: string): Promise<JSZip> {
  const buf = await readFile(filePath)
  return JSZip.loadAsync(buf)
}

/** Read the container + OPF and build a context describing the book's structure. */
async function loadOpf(zip: JSZip): Promise<OpfContext> {
  const containerXml = await zip.file('META-INF/container.xml')?.async('string')
  if (!containerXml) throw new Error('Not a valid EPUB: missing META-INF/container.xml')

  const container = xml.parse(containerXml)
  const rootfile = toArray(container?.container?.rootfiles?.rootfile)[0]
  const opfPath: string | undefined = rootfile?.['@_full-path']
  if (!opfPath) throw new Error('Not a valid EPUB: no rootfile in container.xml')

  const opfXml = await zip.file(opfPath)?.async('string')
  if (!opfXml) throw new Error(`EPUB OPF not found at ${opfPath}`)

  const pkg = xml.parse(opfXml)?.package ?? {}
  const opfDir = dirOf(opfPath)

  const manifest = new Map<string, { href: string; mediaType: string; properties: string }>()
  for (const item of toArray<Record<string, string>>(pkg.manifest?.item)) {
    const id = item['@_id']
    const href = item['@_href']
    if (!id || !href) continue
    manifest.set(id, {
      href: resolvePath(opfDir, href),
      mediaType: item['@_media-type'] ?? '',
      properties: item['@_properties'] ?? ''
    })
  }

  const spineHrefs: string[] = []
  for (const ref of toArray<Record<string, string>>(pkg.spine?.itemref)) {
    if (ref['@_linear'] === 'no') continue
    const entry = manifest.get(ref['@_idref'])
    if (entry) spineHrefs.push(entry.href)
  }

  const ncxId: string | undefined = pkg.spine?.['@_toc']
  const ncxHref = ncxId ? (manifest.get(ncxId)?.href ?? null) : null

  return { zip, opfDir, metadata: pkg.metadata ?? {}, manifest, spineHrefs, ncxHref }
}

/** Convert an XHTML chapter file into paragraph-separated plain text. */
function htmlToText(html: string): string {
  const root = parseHtml(html, {
    blockTextElements: { script: false, style: false, noscript: false }
  })
  root.querySelectorAll('script, style, nav').forEach((el) => el.remove())

  const blocks = new Set([
    'p', 'div', 'br', 'li', 'tr', 'section', 'article', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'pre'
  ])

  const out: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any): void => {
    for (const child of node.childNodes ?? []) {
      if (child.nodeType === 3) {
        out.push(child.text)
      } else if (child.nodeType === 1) {
        const tag = (child.rawTagName ?? '').toLowerCase()
        if (blocks.has(tag)) out.push('\n')
        walk(child)
        if (blocks.has(tag)) out.push('\n')
      }
    }
  }
  walk(root.querySelector('body') ?? root)

  return out
    .join('')
    .replace(/\r/g, '')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Build a map of resolved-href → chapter title from the NCX table of contents. */
async function loadNcxTitles(ctx: OpfContext): Promise<Map<string, string>> {
  const titles = new Map<string, string>()
  if (!ctx.ncxHref) return titles
  const ncxXml = await ctx.zip.file(ctx.ncxHref)?.async('string')
  if (!ncxXml) return titles
  const ncxDir = dirOf(ctx.ncxHref)

  const collect = (points: unknown): void => {
    for (const p of toArray<Record<string, unknown>>(points)) {
      const label = textOf((p.navLabel as Record<string, unknown>)?.text)
      const src = (p.content as Record<string, string>)?.['@_src']
      if (label && src) titles.set(resolvePath(ncxDir, src), label.trim())
      if (p.navPoint) collect(p.navPoint)
    }
  }
  const parsed = xml.parse(ncxXml)
  collect(parsed?.ncx?.navMap?.navPoint)
  return titles
}

/** First heading text in a chapter, used as a title fallback. */
function firstHeading(html: string): string {
  const root = parseHtml(html)
  const h = root.querySelector('h1, h2, h3, h4, h5, h6, title')
  return h?.text?.trim() ?? ''
}

function readTitle(metadata: Record<string, unknown>): string {
  return textOf(metadata['dc:title']) || textOf(metadata['title']) || 'Untitled'
}

function readAuthor(metadata: Record<string, unknown>): string {
  return textOf(metadata['dc:creator']) || textOf(metadata['creator']) || 'Unknown author'
}

/** Find and encode the cover image as a base64 data URL, best-effort. */
async function readCover(ctx: OpfContext): Promise<string | undefined> {
  try {
    // EPUB3: manifest item with properties="cover-image".
    let coverHref: string | undefined
    let mediaType = 'image/jpeg'
    for (const entry of ctx.manifest.values()) {
      if (entry.properties.split(' ').includes('cover-image')) {
        coverHref = entry.href
        mediaType = entry.mediaType || mediaType
        break
      }
    }
    // EPUB2: <meta name="cover" content="manifest-id">.
    if (!coverHref) {
      const metas = toArray<Record<string, string>>(
        (ctx.metadata.meta as unknown) as Record<string, string>[]
      )
      const coverMeta = metas.find((m) => m['@_name'] === 'cover')
      const id = coverMeta?.['@_content']
      if (id) {
        const entry = ctx.manifest.get(id)
        if (entry) {
          coverHref = entry.href
          mediaType = entry.mediaType || mediaType
        }
      }
    }
    if (!coverHref) return undefined
    const b64 = await ctx.zip.file(coverHref)?.async('base64')
    if (!b64) return undefined
    return `data:${mediaType};base64,${b64}`
  } catch {
    return undefined
  }
}

/** Fast metadata read for the library: title, author, cover, chapter count. */
export async function parseEpubMeta(filePath: string): Promise<BookMeta> {
  const zip = await loadZip(filePath)
  const ctx = await loadOpf(zip)
  return {
    title: readTitle(ctx.metadata),
    author: readAuthor(ctx.metadata),
    coverDataUrl: await readCover(ctx),
    chapterCount: ctx.spineHrefs.length
  }
}

/** Full read: every spine document parsed into a titled, clean-text chapter. */
export async function parseEpubChapters(filePath: string): Promise<Chapter[]> {
  const zip = await loadZip(filePath)
  const ctx = await loadOpf(zip)
  const ncxTitles = await loadNcxTitles(ctx)

  const chapters: Chapter[] = []
  let n = 0
  for (const href of ctx.spineHrefs) {
    n++
    const html = await ctx.zip.file(href)?.async('string')
    if (!html) continue
    const text = htmlToText(html)
    if (!text) continue // skip empty front-matter/spacer documents
    const title = ncxTitles.get(href) || firstHeading(html) || `Section ${n}`
    chapters.push({ title, text })
  }
  return chapters
}
