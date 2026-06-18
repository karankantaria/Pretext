import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './store/appStore'
import Library from './screens/Library'
import Camouflage from './screens/Camouflage'
import Reader from './screens/Reader'

function Router(): React.JSX.Element {
  const { screen } = useApp()
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
