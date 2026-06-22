// In-reader dictionary. Type (or arrive with a selected) word and see its
// definition, fetched in the main process via dictionaryapi.dev. Styled as the
// same neutral navigator as the contents menu so it doesn't break the disguise.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DictEntry } from '../../../shared/types'

type Status = 'idle' | 'loading' | 'done' | 'notfound' | 'error'

export default function DictionaryModal({
  initialWord,
  onClose
}: {
  initialWord: string
  onClose: () => void
}): React.JSX.Element {
  const [query, setQuery] = useState(initialWord)
  const [entry, setEntry] = useState<DictEntry | null>(null)
  // Seed straight to "loading" when we open with a word, so the effect needn't
  // set state synchronously to show the spinner.
  const [status, setStatus] = useState<Status>(initialWord.trim() ? 'loading' : 'idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // The network half: all state changes happen after the await, never synchronously.
  const run = useCallback(async (word: string) => {
    try {
      const result = await window.api.dictionary.lookup(word)
      if (result) {
        setEntry(result)
        setStatus('done')
      } else {
        setEntry(null)
        setStatus('notfound')
      }
    } catch (e) {
      setEntry(null)
      setError(e instanceof Error ? e.message : 'Lookup failed.')
      setStatus('error')
    }
  }, [])

  // User-initiated lookup (form submit): show the spinner, then fetch.
  const lookup = useCallback(
    (raw: string) => {
      const word = raw.trim()
      if (!word) return
      setStatus('loading')
      setError('')
      run(word)
    },
    [run]
  )

  // Focus the field, select any prefilled word, and look it up on open.
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    if (initialWord.trim()) run(initialWord)
  }, [initialWord, run])

  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center bg-black/55 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70%] w-[460px] flex-col overflow-hidden rounded-xl border border-[#2b3650] bg-[#0d1117] text-[#c8ccd4] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            lookup(query)
          }}
          className="flex items-center gap-2 border-b border-[#1b2230] px-3 py-3"
        >
          <span className="text-[#5c6370]">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Look up a word…"
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#e6edf3] placeholder:text-[#3b4252] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded border border-[#2b3650] px-2.5 py-1 text-xs text-[#c8ccd4] hover:border-brand/60 hover:text-brand"
          >
            Define
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-[#7d8694] hover:bg-[#161b22] hover:text-[#c8ccd4]"
          >
            ✕
          </button>
        </form>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {status === 'idle' && (
            <div className="py-6 text-center text-xs text-[#3b4252]">
              Type a word and press Enter.
            </div>
          )}
          {status === 'loading' && (
            <div className="py-6 text-center text-xs text-[#5c6370]">
              <span className="animate-pulse">looking up…</span>
            </div>
          )}
          {status === 'notfound' && (
            <div className="py-6 text-center text-xs text-[#7d8694]">
              No definition found for “{query.trim()}”.
            </div>
          )}
          {status === 'error' && (
            <div className="py-6 text-center text-xs text-[#e06c75]">{error}</div>
          )}
          {status === 'done' && entry && (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold text-[#e6edf3]">{entry.word}</span>
                {entry.phonetic && <span className="text-xs text-[#5c6370]">{entry.phonetic}</span>}
              </div>
              <ol className="mt-3 space-y-3">
                {entry.senses.map((s, i) => (
                  <li key={i} className="text-[13px] leading-snug">
                    <div>
                      {s.partOfSpeech && (
                        <span className="mr-2 text-[11px] italic text-brand">{s.partOfSpeech}</span>
                      )}
                      <span className="text-[#c8ccd4]">{s.definition}</span>
                    </div>
                    {s.example && (
                      <div className="mt-0.5 text-[12px] italic text-[#5c6370]">“{s.example}”</div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="border-t border-[#1b2230] px-4 py-2 text-[10px] text-[#3b4252]">
          press d to look up · definitions from dictionaryapi.dev
        </div>
      </div>
    </div>
  )
}
