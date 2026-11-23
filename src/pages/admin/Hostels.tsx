import { useState } from 'react'
import { hallUsage, wingLetter } from '../../../shared/allocation.ts'
import type { Hostel, NewHostel } from '../../../shared/types.ts'
import AdminHeader from '../../components/AdminHeader.tsx'
import EmptyBox from '../../components/EmptyBox.tsx'
import HostelModal from '../../components/HostelModal.tsx'
import SmallModal from '../../components/SmallModal.tsx'
import { useApp } from '../../store.tsx'
import { adminError, blueButton, card, cx, outlineButton, pill, wideLightInput } from '../../ui.ts'

const wingList = (wings: number) => (wings > 8 ? `A–${wingLetter(wings - 1)}` : Array.from({ length: wings }, (_, i) => wingLetter(i)).join(', '))

// Green / grey switch: on = available to volunteers
function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={cx('relative h-6 w-10 flex-none rounded-full transition-colors', on ? 'bg-[#22c55e]' : 'bg-[#ef4444]')}
    >
      <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]', on ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

export default function Hostels() {
  const { data, addHostel, editHostel, blockHostel, unblockHostel, deleteHostel } = useApp()
  const [modal, setModal] = useState<{ type: 'add' } | { type: 'edit' | 'block'; hostel: Hostel } | null>(null)
  const [message, setMessage] = useState('')
  const [blockError, setBlockError] = useState('')

  async function save(form: NewHostel) {
    const problem = modal?.type === 'edit' ? await editHostel(modal.hostel.id, form) : await addHostel(form)
    if (!problem) setModal(null)
    return problem
  }

  async function handleDelete(hostel: Hostel) {
    if (!window.confirm(`Delete ${hostel.name}? This can't be undone.`)) return
    const problem = await deleteHostel(hostel.id)
    setModal(null)
    setMessage(problem)
  }

  async function handleUnblock(hostel: Hostel) {
    setMessage(await unblockHostel(hostel.id))
  }

  return (
    <div className="font-inter">
      <AdminHeader title="Hostel & Room Configuration" subtitle="Set wings, floors, room capacities, and block/unblock halls for volunteers.">
        <button onClick={() => setModal({ type: 'add' })} className={blueButton}>
          <span className="text-lg leading-none">+</span> Add New Hostel
        </button>
      </AdminHeader>

      <div className="mb-[18px] flex items-center gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4">
        <img src="/assets/info.svg" alt="" className="size-6 flex-none" />
        <p className="text-sm font-medium text-[#1e3a8a]">
          Country Room Isolation Policy Active: Rooms allocated to a country will not be shared with subsequent countries even if beds remain
          empty. Next country automatically starts in a fresh room.
        </p>
      </div>

      {message && <p className={adminError}>{message}</p>}

      {data.hostels.length === 0 ? (
        <EmptyBox
          title="No hostels configured"
          text="Create the first hall to make rooms available to volunteers."
          onAdd={() => setModal({ type: 'add' })}
          addLabel="Add New Hostel"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {data.hostels.map((h) => {
            const usage = hallUsage(data.countries, h)
            const specs = [
              ['WINGS', `${h.wings} Wing${h.wings > 1 ? 's' : ''} (${wingList(h.wings)})`],
              ['FLOORS', `${h.floors} Floor${h.floors > 1 ? 's' : ''} each`],
              ['ROOMS', `${h.roomsPerFloor} rooms / floor`],
              ['ROOM CAPACITY', `${h.capacityPerRoom} delegates / room`],
            ]
            return (
              <article key={h.id} className={cx(card, 'flex flex-col gap-3.5 px-5 py-[18px]')}>
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold">{h.name}</h2>
                    {h.blocked ? (
                      <span className={cx(pill, 'bg-[#fef2f2] text-[#b91c1c]')}>RESERVED / MAINTENANCE</span>
                    ) : (
                      <span className={cx(pill, 'bg-[#f1f5f9] text-[#475569]')}>{h.gender.toUpperCase()} ONLY</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      on={!h.blocked}
                      label={h.blocked ? `Unblock ${h.name}` : `Block ${h.name}`}
                      onClick={() => (h.blocked ? handleUnblock(h) : setModal({ type: 'block', hostel: h }))}
                    />
                    <span className={cx('text-xs font-semibold', h.blocked ? 'text-[#b91c1c]' : 'text-[#15803d]')}>
                      {h.blocked ? 'BLOCKED / Marked Unavailable on Volunteer App' : 'Active / Available to Volunteers'}
                    </span>
                  </div>
                </header>

                {h.blocked ? (
                  <>
                    <div className="flex w-fit flex-wrap items-center gap-2.5 rounded-lg bg-[#fef2f2] px-3 py-2.5">
                      <span className={cx(pill, 'bg-[#fee2e2] text-[#b91c1c]')}>BLOCKED</span>
                      <span className="text-[13px] font-medium text-[#991b1b]">Marked unavailable on the volunteer app</span>
                    </div>
                    <p className="flex flex-wrap gap-2 text-[13px]">
                      <b className="font-semibold text-[#64748b]">Reason:</b>
                      <span className="font-medium text-[#334155]">{h.blockReason || 'No reason given'}</span>
                    </p>
                  </>
                ) : (
                  <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                    {specs.map(([label, value]) => (
                      <div key={label} className="flex min-w-0 flex-col gap-1 rounded-lg bg-[#f8fafc] px-3.5 py-3 font-semibold">
                        <small className="text-[11px] text-[#64748b]">{label}</small>
                        <span className="truncate text-sm text-[#0f172a]">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {h.blocked ? (
                    <>
                      <button onClick={() => handleUnblock(h)} className={outlineButton}>
                        Unblock Hall
                      </button>
                      <button onClick={() => setModal({ type: 'edit', hostel: h })} className={outlineButton}>
                        Manage Wings
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setModal({ type: 'edit', hostel: h })} className={outlineButton}>
                        Edit Configuration
                      </button>
                      <button onClick={() => setModal({ type: 'block', hostel: h })} className={outlineButton}>
                        Block Hall
                      </button>
                    </>
                  )}
                  <span className="ml-auto text-xs text-[#64748b]">
                    {usage.used} of {usage.total} rooms allocated
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <HostelModal
          key={modal.type === 'edit' ? modal.hostel.id : 'new'}
          hostel={modal.type === 'edit' ? modal.hostel : undefined}
          defaultCapacity={data.rules.capacity}
          onClose={() => setModal(null)}
          onSave={save}
          onDelete={modal.type === 'edit' ? () => handleDelete(modal.hostel) : undefined}
        />
      )}

      {modal?.type === 'block' && (
        <SmallModal
          title={`Block ${modal.hostel.name}?`}
          text="Volunteers won't be able to pick this hall. Rooms that are already allocated stay as they are."
          submitLabel="Block Hall"
          danger
          error={blockError}
          onClose={() => {
            setModal(null)
            setBlockError('')
          }}
          onSubmit={async (form) => {
            const problem = await blockHostel(modal.hostel.id, String(form.get('reason') ?? '').trim())
            setBlockError(problem)
            if (!problem) setModal(null)
          }}
        >
          <label className="flex flex-col gap-2 text-[13px] font-semibold text-[#334155]">
            Reason (optional)
            <input name="reason" maxLength={120} placeholder="e.g. Renovation of Floor 2 plumbing" className={wideLightInput} autoFocus />
          </label>
        </SmallModal>
      )}
    </div>
  )
}
