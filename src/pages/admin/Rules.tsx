import { useState } from 'react'
import { formatRooms, simulateAllocation } from '../../../shared/allocation.ts'
import AdminHeader from '../../components/AdminHeader.tsx'
import { useApp } from '../../store.tsx'
import { adminError, blueButton, card, cx, pill } from '../../ui.ts'

const ruleCard = cx(card, 'flex min-w-0 flex-col gap-4 p-[18px]')
const ruleTitle = 'text-base font-semibold text-[#0f172a]'
const inputBox = 'flex items-center gap-2.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-[13px]'

export default function Rules() {
  const { data, saveRules } = useApp()
  const [draft, setDraft] = useState(data.rules)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testCount, setTestCount] = useState(21)
  const [testHallId, setTestHallId] = useState(data.hostels.find((h) => !h.blocked)?.id ?? 0)

  const unsaved = draft.capacity !== data.rules.capacity || draft.specialNeeds !== data.rules.specialNeeds
  const setCapacity = (capacity: number) => setDraft({ ...draft, capacity: Math.min(20, Math.max(1, capacity)) })

  // Worked example for the isolation policy, using the capacity being edited
  const rooms = Math.ceil(21 / draft.capacity)
  const lastRoom = 21 - (rooms - 1) * draft.capacity
  const isolated = draft.capacity - lastRoom

  // Live simulator (uses the rules being edited, before saving)
  const test = Number.isInteger(testCount) && testCount > 0 ? simulateAllocation(data, draft, testHallId, testCount) : { error: 'Enter a delegate count.' }

  async function handleSave() {
    const problem = await saveRules(draft)
    setError(problem)
    if (problem) return
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="font-inter">
      <AdminHeader title="Room Allocation Engine & Rules" subtitle="Configure automatic assignment algorithms, room capacities, and country isolation rules.">
        <button onClick={handleSave} disabled={!unsaved && !saved} className={cx(blueButton, 'px-5')}>
          {saved ? '✓ Rules Saved' : 'Save Rules'}
        </button>
      </AdminHeader>

      {error && <p className={adminError}>{error}</p>}

      <div className="flex flex-col gap-5">
        <article className={cx(card, 'flex flex-col gap-3.5 p-5')}>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Strict Country Isolation Policy</h2>
            <span className={cx(pill, 'bg-[#dcfce7] text-[#16a34a]')}>ACTIVE / LOCKED</span>
          </div>
          <p className="text-sm text-[#475569]">
            Guarantees no room sharing across nationalities. When a country&apos;s allocation finishes with empty beds in the last room, those beds
            remain locked to that country. The next country automatically begins in a fresh, unallocated room.
          </p>
          <p className="max-w-[842px] rounded-lg bg-[#f8fafc] px-3.5 py-3 text-[13px] font-medium text-[#334155]">
            Example: 21 delegates at {draft.capacity} beds/room = {rooms} room{rooms > 1 ? 's' : ''} allocated.{' '}
            {isolated > 0
              ? `Room ${rooms} has ${lastRoom} occupant${lastRoom > 1 ? 's' : ''}, ${isolated} bed${isolated > 1 ? 's' : ''} isolated.`
              : `Room ${rooms} is full.`}{' '}
            Next country starts at Room {rooms + 1}.
          </p>
        </article>

        <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
          <article className={ruleCard}>
            <h2 className={ruleTitle}>Standard Room Capacity</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCapacity(draft.capacity - 1)}
                aria-label="Fewer people per room"
                className="grid size-9 place-items-center rounded-lg border border-[#cbd5e1] bg-white text-lg font-semibold text-[#334155] hover:bg-slate-50"
              >
                −
              </button>
              <b className="text-[15px] font-semibold">{draft.capacity} People / Room</b>
              <button
                onClick={() => setCapacity(draft.capacity + 1)}
                aria-label="More people per room"
                className="grid size-9 place-items-center rounded-lg border border-[#cbd5e1] bg-white text-lg font-semibold text-[#334155] hover:bg-slate-50"
              >
                +
              </button>
            </div>
            <p className="text-xs text-[#64748b]">If a hall&apos;s rooms hold fewer beds, the hall&apos;s own capacity is used.</p>
          </article>

          <article className={ruleCard}>
            <h2 className={ruleTitle}>Filling Sequence</h2>
            <div className="flex w-fit items-center gap-2.5 rounded-lg border border-[#c7d2fe] bg-[#eef2ff] p-3">
              <span className="grid size-4 flex-none place-items-center rounded-full border-2 border-[#4f46e5]">
                <span className="size-1.5 rounded-full bg-[#4f46e5]" />
              </span>
              <span className="flex flex-col gap-[5px]">
                <b className="text-sm font-semibold">Contiguous Rooms</b>
                <small className="text-xs text-[#64748b]">Keep same country in adjacent rooms</small>
              </span>
            </div>
          </article>

          <article className={ruleCard}>
            <h2 className={ruleTitle}>Special Needs Priority</h2>
            <div className="flex items-center gap-2.5">
              <button
                role="switch"
                aria-checked={draft.specialNeeds}
                aria-label="Special needs priority"
                onClick={() => setDraft({ ...draft, specialNeeds: !draft.specialNeeds })}
                className={cx('relative h-[26px] w-11 rounded-full transition-colors', draft.specialNeeds ? 'bg-[#22c55e]' : 'bg-[#cbd5e1]')}
              >
                <span className={cx('absolute top-[3px] size-5 rounded-full bg-white shadow transition-[left]', draft.specialNeeds ? 'left-[21px]' : 'left-[3px]')} />
              </button>
              <span className={cx(pill, draft.specialNeeds ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#f1f5f9] text-[#475569]')}>
                {draft.specialNeeds ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-[13px] font-medium text-[#334155]">Automatically assign elderly &amp; special delegates to Ground Floor</p>
          </article>
        </div>

        <article className={cx(card, 'flex flex-col gap-4 p-5')}>
          <h2 className={ruleTitle}>Test Allocation Simulator</h2>
          <div className="flex flex-wrap items-center gap-4">
            <label className={inputBox}>
              <span className="font-medium text-[#64748b]">Test Delegate Count:</span>
              <input
                type="number"
                min="1"
                value={Number.isNaN(testCount) ? '' : testCount}
                onChange={(e) => setTestCount(Number.parseInt(e.target.value, 10))}
                className="w-16 bg-transparent font-semibold text-[#0f172a] outline-none"
              />
            </label>
            <label className={inputBox}>
              <span className="font-medium text-[#64748b]">Hall:</span>
              <select value={testHallId} onChange={(e) => setTestHallId(Number(e.target.value))} className="cursor-pointer bg-transparent font-semibold text-[#0f172a] outline-none">
                {data.hostels.length === 0 && <option value={0}>No halls yet</option>}
                {data.hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.gender})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {'error' in test ? (
            <p className="w-fit max-w-full rounded-lg bg-[#fef2f2] px-3.5 py-3 text-[13px] font-medium text-[#991b1b]">{test.error}</p>
          ) : (
            <p className="w-fit max-w-full rounded-lg bg-[#f0fdf4] px-3.5 py-3 text-[13px] font-medium text-[#166534]">
              Result: {test.rooms.length} Room{test.rooms.length > 1 ? 's' : ''} Allocated ({test.hostel.name} {formatRooms(test.rooms)}) •{' '}
              {test.leftover ? `1 Partial Room (${test.leftover} of ${test.perRoom} beds)` : '0 Partial Rooms'} • 0 Shared Beds with next country.
            </p>
          )}
        </article>
      </div>
    </div>
  )
}
