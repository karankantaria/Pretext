// "How to use" overlay shown from the library home — explains the flow and
// lists every shortcut. Click the backdrop or the ✕ to close.

import { motion } from 'framer-motion'

function Key({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-[#2b3650] bg-[#161b22] px-1.5 py-0.5 font-mono text-[11px] text-[#c8ccd4]">
      {children}
    </kbd>
  )
}

function Row({ keys, desc }: { keys: React.ReactNode; desc: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex w-44 shrink-0 flex-wrap gap-1">{keys}</div>
      <div className="text-[13px] text-[#a3acba]">{desc}</div>
    </div>
  )
}

export default function HelpModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85%] w-[560px] flex-col overflow-hidden rounded-2xl border border-[#2b3650] bg-[#0d1117] text-[#c8ccd4] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#1b2230] px-5 py-4">
          <div className="text-base font-bold tracking-tight">
            <span className="text-[#e6edf3]">Pre</span>
            <span className="text-brand">text</span>
          </div>
          <span className="text-xs text-[#5c6370]">— read in plain sight</span>
          <button
            onClick={onClose}
            className="ml-auto grid h-7 w-7 place-items-center rounded-md text-[#7d8694] hover:bg-[#161b22] hover:text-[#c8ccd4]"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {/* Getting started */}
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">
              Getting started
            </h3>
            <ol className="space-y-1.5 text-[13px] text-[#a3acba]">
              <li>
                <span className="text-[#e6edf3]">1.</span> Hit{' '}
                <span className="text-[#c8ccd4]">+ Import</span> to add your <code>.epub</code> books.
              </li>
              <li>
                <span className="text-[#e6edf3]">2.</span> Pick a book, then choose a{' '}
                <span className="text-[#c8ccd4]">camouflage</span> — a disguise that looks like work
                (an editor, dashboard, doc, news site…).
              </li>
              <li>
                <span className="text-[#e6edf3]">3.</span> Read. Your place saves automatically and
                resumes exactly where you left off.
              </li>
            </ol>
          </section>

          {/* While reading */}
          <section className="mb-5">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand">
              While reading
            </h3>
            <Row
              keys={
                <>
                  <Key>←</Key>
                  <Key>→</Key>
                  <span className="text-[11px] text-[#5c6370]">or click sides</span>
                </>
              }
              desc="Turn pages"
            />
            <Row keys={<Key>C</Key>} desc="Open contents (jump chapters) & text size" />
            <Row keys={<Key>D</Key>} desc="Look up a word in the dictionary" />
            <Row
              keys={
                <>
                  <Key>−</Key>
                  <Key>=</Key>
                </>
              }
              desc="Shrink / grow the text"
            />
            <Row
              keys={
                <>
                  <Key>Backspace</Key>
                  <span className="text-[11px] text-[#5c6370]">or hover ←</span>
                </>
              }
              desc="Back to the library"
            />
          </section>

          {/* Panic */}
          <section className="mb-5 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand">
              Panic — instant hide
            </h3>
            <Row
              keys={
                <>
                  <Key>Esc</Key>
                  <Key>F9</Key>
                </>
              }
              desc="Instantly cover the screen with a dull email inbox"
            />
            <div className="mt-1 text-[12px] text-[#7d8694]">
              <Key>F9</Key> works even when Pretext isn’t the focused window. Press the key again or
              click to resume your exact spot.
            </div>
          </section>

          {/* Library */}
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand">
              Library
            </h3>
            <ul className="space-y-1 text-[13px] text-[#a3acba]">
              <li>
                <span className="text-[#c8ccd4]">+ Import</span> — add EPUB files.
              </li>
              <li>
                <span className="text-[#c8ccd4]">Hover a book</span> — move it between shelves or
                remove it.
              </li>
              <li>
                Books auto-sort into <span className="text-[#c8ccd4]">In Progress</span> ·{' '}
                <span className="text-[#c8ccd4]">Queue</span> ·{' '}
                <span className="text-[#c8ccd4]">Archived</span>.
              </li>
            </ul>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
