// Panic cover. A deliberately dull webmail inbox — unmistakably "doing email,"
// never a book or anything flashy. Shown instantly over everything; click (or
// Escape / F9 again) to dismiss and return to the exact spot underneath.

import { useApp } from '../store/appStore'

const FOLDERS = [
  { name: 'Inbox', count: 3 },
  { name: 'Starred', count: 0 },
  { name: 'Sent', count: 0 },
  { name: 'Drafts', count: 1 },
  { name: 'Archive', count: 0 },
  { name: 'Spam', count: 0 },
  { name: 'Trash', count: 0 }
]

const MAIL = [
  { from: 'Payroll', subj: 'Your payslip for this month is available', time: '09:41', unread: true, snip: 'View your latest payslip in the self-service portal…' },
  { from: 'Alex Whitfield', subj: 'RE: Q3 planning sync — notes', time: '09:12', unread: true, snip: 'Thanks all, I’ve attached the action items from…' },
  { from: 'IT Service Desk', subj: 'Scheduled maintenance this weekend', time: 'Tue', unread: true, snip: 'Email will be briefly unavailable on Saturday…' },
  { from: 'Dana Olsson', subj: 'Invoice #4821 — approval needed', time: 'Tue', unread: false, snip: 'Could you approve the attached invoice when you…' },
  { from: 'Confluence', subj: 'Weekly summary: 6 pages updated', time: 'Mon', unread: false, snip: 'Here’s what changed in your spaces this week…' },
  { from: 'Facilities', subj: 'Desk booking confirmation', time: 'Mon', unread: false, snip: 'Your booking for Thursday is confirmed…' },
  { from: 'Marcus Lee', subj: 'Lunch tomorrow?', time: 'Fri', unread: false, snip: 'A few of us are heading out around noon…' }
]

export default function PanicScreen(): React.JSX.Element {
  const { setPanic } = useApp()
  return (
    <div
      className="fixed inset-0 z-50 flex select-none flex-col bg-[#f6f8fc] text-[#202124]"
      onClick={() => setPanic(false)}
      title="Click to resume"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[#e0e3e7] bg-white px-4 py-2">
        <span className="text-lg">✉</span>
        <span className="text-[15px] font-medium text-[#5f6368]">Mail</span>
        <div className="mx-4 flex-1">
          <div className="flex h-9 max-w-xl items-center gap-2 rounded-lg bg-[#eaf1fb] px-3 text-[13px] text-[#5f6368]">
            <span>🔍</span>
            <span>Search mail</span>
          </div>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1a73e8] text-sm font-medium text-white">
          U
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Folders */}
        <div className="w-56 shrink-0 border-r border-[#e0e3e7] bg-[#f6f8fc] p-3">
          <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[14px] font-medium text-[#3c4043] shadow-sm">
            ✏️ Compose
          </div>
          {FOLDERS.map((f, i) => (
            <div
              key={f.name}
              className={`flex items-center gap-3 rounded-r-full px-4 py-1.5 text-[14px] ${
                i === 0 ? 'bg-[#d3e3fd] font-semibold text-[#041e49]' : 'text-[#3c4043]'
              }`}
            >
              <span>{f.name}</span>
              {f.count > 0 && <span className="ml-auto text-[12px]">{f.count}</span>}
            </div>
          ))}
        </div>

        {/* Mail list */}
        <div className="w-[26rem] shrink-0 overflow-hidden border-r border-[#e0e3e7] bg-white">
          <div className="flex items-center gap-3 border-b border-[#e0e3e7] px-4 py-2 text-[12px] text-[#5f6368]">
            <span>☐</span>
            <span>↻</span>
            <span className="ml-auto">1–{MAIL.length} of 2,418</span>
          </div>
          {MAIL.map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 border-b border-[#f1f3f4] px-4 py-2.5 text-[13px] ${
                m.unread ? 'bg-white font-semibold text-[#202124]' : 'bg-[#fbfbfb] text-[#5f6368]'
              }`}
            >
              <span className="text-[#dadce0]">☆</span>
              <span className="w-28 shrink-0 truncate">{m.from}</span>
              <span className="min-w-0 flex-1 truncate">
                {m.subj}
                <span className="font-normal text-[#5f6368]"> — {m.snip}</span>
              </span>
              <span className="shrink-0 text-[11px] text-[#5f6368]">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Reading pane */}
        <div className="min-w-0 flex-1 bg-white p-6">
          <div className="text-[20px] text-[#202124]">RE: Q3 planning sync — notes</div>
          <div className="mt-3 flex items-center gap-3 border-b border-[#e0e3e7] pb-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#34a853] text-sm font-medium text-white">
              A
            </span>
            <div className="text-[13px]">
              <div className="font-medium text-[#202124]">Alex Whitfield</div>
              <div className="text-[#5f6368]">to me, team · 09:12</div>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#3c4043]">
            <p>Hi all,</p>
            <p>
              Thanks for the productive session this morning. I’ve consolidated the notes and the
              action items below. Please review your assignments and update the tracker by end of
              week so we can keep the timeline on track.
            </p>
            <p>
              We agreed to revisit the resourcing question at the next sync and to circulate the
              revised estimates beforehand. Shout if anything looks off.
            </p>
            <p>Best,<br />Alex</p>
          </div>
        </div>
      </div>
    </div>
  )
}
