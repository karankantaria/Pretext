// Dictionary lookup. Runs in the main process so it isn't blocked by the
// renderer's strict CSP (default-src 'self'). Hits the free dictionaryapi.dev
// service and normalizes its response into a compact DictEntry.

import type { DictEntry, DictSense } from '../shared/types'

const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const TIMEOUT_MS = 6000
const MAX_SENSES = 8

// Minimal shapes of the bits of the API response we read.
interface ApiDefinition {
  definition?: string
  example?: string
}
interface ApiMeaning {
  partOfSpeech?: string
  definitions?: ApiDefinition[]
}
interface ApiEntry {
  word?: string
  phonetic?: string
  meanings?: ApiMeaning[]
}

/** Look up a single word; resolves null when there's no definition. */
export async function lookupWord(raw: string): Promise<DictEntry | null> {
  // Keep letters, hyphens and apostrophes; one word only.
  const word = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z'-]/gi, '')
  if (!word) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT + encodeURIComponent(word), { signal: controller.signal })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Dictionary service error (${res.status})`)

    const data = (await res.json()) as ApiEntry[] | { title?: string }
    if (!Array.isArray(data) || data.length === 0) return null

    const senses: DictSense[] = []
    let phonetic: string | undefined
    let headword = word

    for (const entry of data) {
      if (entry.word) headword = entry.word
      if (!phonetic && entry.phonetic) phonetic = entry.phonetic
      for (const m of entry.meanings ?? []) {
        for (const d of m.definitions ?? []) {
          if (!d.definition) continue
          senses.push({
            partOfSpeech: m.partOfSpeech ?? '',
            definition: d.definition,
            example: d.example
          })
          if (senses.length >= MAX_SENSES) break
        }
        if (senses.length >= MAX_SENSES) break
      }
      if (senses.length >= MAX_SENSES) break
    }

    if (senses.length === 0) return null
    return { word: headword, phonetic, senses }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Dictionary lookup timed out.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
