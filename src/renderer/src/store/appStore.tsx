// App-level navigation state: which of the three screens is showing, and the
// current book + chosen skin. Deliberately tiny — screens read/drive this.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Screen = 'library' | 'camouflage' | 'reader'

interface AppState {
  screen: Screen
  bookId: string | null
  skinId: string
  /** When true, the innocuous panic cover is shown over everything. */
  panic: boolean
  /** Reading text-size multiplier (applied by skins to their font + line height). */
  fontScale: number
  /** Library → Camouflage: a book was chosen. */
  pickBook: (id: string) => void
  /** Camouflage → Reader: a skin was chosen. */
  startReading: (skinId: string) => void
  /** Back to the shelf. */
  goLibrary: () => void
  /** Reader/Camouflage → Library home. */
  goCamouflage: () => void
  togglePanic: () => void
  setPanic: (on: boolean) => void
  setFontScale: (v: number) => void
}

const FONT_SCALE_MIN = 0.8
const FONT_SCALE_MAX = 1.6

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('library')
  const [bookId, setBookId] = useState<string | null>(null)
  const [skinId, setSkinId] = useState<string>('code')
  const [panic, setPanicState] = useState(false)
  const [fontScale, setFontScaleState] = useState<number>(() => {
    const v = Number(localStorage.getItem('pretext.fontScale'))
    return v >= FONT_SCALE_MIN && v <= FONT_SCALE_MAX ? v : 1
  })

  const value = useMemo<AppState>(
    () => ({
      screen,
      bookId,
      skinId,
      panic,
      fontScale,
      pickBook: (id) => {
        setBookId(id)
        setScreen('camouflage')
      },
      startReading: (sid) => {
        setSkinId(sid)
        setScreen('reader')
      },
      goLibrary: () => setScreen('library'),
      goCamouflage: () => setScreen('camouflage'),
      togglePanic: () => setPanicState((p) => !p),
      setPanic: (on) => setPanicState(on),
      setFontScale: (v) => {
        const c = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round(v * 100) / 100))
        setFontScaleState(c)
        localStorage.setItem('pretext.fontScale', String(c))
      }
    }),
    [screen, bookId, skinId, panic, fontScale]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
