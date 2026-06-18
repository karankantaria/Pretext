// App-level navigation state: which of the three screens is showing, and the
// current book + chosen skin. Deliberately tiny — screens read/drive this.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Screen = 'library' | 'camouflage' | 'reader'

interface AppState {
  screen: Screen
  bookId: string | null
  skinId: string
  /** Library → Camouflage: a book was chosen. */
  pickBook: (id: string) => void
  /** Camouflage → Reader: a skin was chosen. */
  startReading: (skinId: string) => void
  /** Back to the shelf. */
  goLibrary: () => void
  /** Reader/Camouflage → Library home. */
  goCamouflage: () => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('library')
  const [bookId, setBookId] = useState<string | null>(null)
  const [skinId, setSkinId] = useState<string>('code')

  const value = useMemo<AppState>(
    () => ({
      screen,
      bookId,
      skinId,
      pickBook: (id) => {
        setBookId(id)
        setScreen('camouflage')
      },
      startReading: (sid) => {
        setSkinId(sid)
        setScreen('reader')
      },
      goLibrary: () => setScreen('library'),
      goCamouflage: () => setScreen('camouflage')
    }),
    [screen, bookId, skinId]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
