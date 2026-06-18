import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './store/appStore'
import Library from './screens/Library'
import Camouflage from './screens/Camouflage'
import Reader from './screens/Reader'
import PanicScreen from './screens/PanicScreen'

function Router(): React.JSX.Element {
  const { screen, panic, togglePanic } = useApp()

  // Escape (focused) toggles panic; the global F9 hotkey routes here too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        togglePanic()
      }
    }
    window.addEventListener('keydown', onKey)
    const off = window.api.onPanic(togglePanic)
    return () => {
      window.removeEventListener('keydown', onKey)
      off()
    }
  }, [togglePanic])

  return (
    <div className="h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="h-full w-full"
        >
          {screen === 'library' && <Library />}
          {screen === 'camouflage' && <Camouflage />}
          {screen === 'reader' && <Reader />}
        </motion.div>
      </AnimatePresence>
      {panic && <PanicScreen />}
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}

export default App
