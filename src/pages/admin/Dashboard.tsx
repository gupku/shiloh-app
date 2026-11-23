import { hallUsage } from '../../../shared/allocation.ts'
import AdminHeader from '../../components/AdminHeader.tsx'
import { useApp } from '../../store.tsx'
import { blueButton, card, cardTitle, cx, mutedBox, pill } from '../../ui.ts'
import { exportMasterSheet } from '../../utils/exports.ts'
import { formatLogTime, isOnline, roleLabel } from '../../utils/format.ts'

const DOT_COLOURS: Record<string, string> = {
  'Allocated Country': 'bg-[#22c55e]',
  'Blocked Hall': 'bg-[#f59e0b]',
  'Removed Country': 'bg-[#ef4444]',
  'Deleted Hostel': 'bg-[#ef4444]',
  'Deleted Account': 'bg-[#ef4444]',
}

export default function AdminDashboard() {
  const { data } = useApp()

  const halls = data.hostels.map((h) => ({ ...h, ...hallUsage(data.countries, h) }))
  const openHalls = halls.filter((h) => !h.blocked)
  const beds = openHalls.reduce((sum, h) => sum + h.total * h.capacityPerRoom, 0)
  const occupied = data.countries.flatMap((c) => c.groups).filter((g) => g.rooms.length).reduce((sum, g) => sum + g.count, 0)
  const names = data.countries.map((c) => c.name)
  const volunteers = data.accounts.filter((a) => a.role === 'volunteer' && a.status === 'Active')
  const online = volunteers.filter((v) => isOnline(v.lastActive)).length
  const feed = data.audits.filter((a) => a.action !== 'Signed In').slice(0, 6)

  const metrics: [label: string, value: string, note: string, colour: string][] = [
    ['TOTAL BED CAPACITY', `${beds.toLocaleString()} Beds`, `${occupied.toLocaleString()} Occupied (${beds ? Math.round((occupied / beds) * 100) : 0}%)`, 'text-[#22ef58]'],
    [
      'HOSTELS IN OPERATION',
      `${openHalls.length} Hall${openHalls.length === 1 ? '' : 's'}`,
      `${halls.length - openHalls.length} Hall${halls.length - openHalls.length === 1 ? '' : 's'} Reserved / Blocked`,
      'text-[#0f172a]',
    ],
    [
      'REGISTERED COUNTRIES',
      `${names.length} Nations`,
      names.length ? `${names.slice(0, 4).join(', ')}${names.length > 4 ? ', etc.' : ''}` : 'No countries yet',
      'text-[#0f172a]',
    ],
    ['ACTIVE VOLUNTEERS', `${online} Online`, online ? 'Allocating live across zones' : `${volunteers.length} active account(s), none online`, 'text-[#16a34a]'],
  ]

  return (
    <div className="font-inter">
      <AdminHeader title="Admin Overview" subtitle="Central Shiloh Accommodation & Resource Management" titleClassName="font-sans">
        <button onClick={() => exportMasterSheet(data)} className={blueButton}>
          Download Global Master Sheet
        </button>
      </AdminHeader>

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map(([label, value, note, colour]) => (
          <article key={label} className="flex min-w-0 flex-col gap-2 rounded-xl border border-white bg-white px-5 py-[18px] shadow-card">
            <small className="text-xs font-semibold text-[#6f7276]">{label}</small>
            <b className={cx('text-2xl font-bold', colour)}>{value}</b>
            <span className="truncate text-[13px] text-[#6f7276]" title={note}>
              {note}
            </span>
          </article>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,780fr)_minmax(0,420fr)] items-start gap-5 max-xl:grid-cols-1">
        <article className={cx(card, 'flex flex-col gap-4 border-white p-5')}>
          <h2 className={cardTitle}>Hostel Utilization &amp; Capacity Breakdown</h2>
          {halls.length === 0 ? (
            <p className={mutedBox}>No hostels yet. Add halls on the Hostel Setup page.</p>
          ) : (
            halls.map((h) => {
              const percent = h.total ? Math.round((h.used / h.total) * 100) : 0
              return h.blocked ? (
                <div key={h.id} className="flex flex-col gap-2 rounded-lg bg-[#f8fafc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-sm font-semibold text-[#35405b]">{h.name}</b>
                    <span className={cx(pill, 'bg-[#f9e491] text-[#b45309]')}>BLOCKED</span>
                  </div>
                  <p className="text-xs text-[#6f7276]">
                    {h.blockReason ? `Reserved: ${h.blockReason}` : 'Reserved and unavailable for standard allocation.'}
                  </p>
                </div>
              ) : (
                <div key={h.id} className="flex flex-col gap-2.5 rounded-lg bg-[#f8fafc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <b className="text-sm font-semibold text-[#35405b]">{h.name}</b>
                      <span className={cx(pill, 'bg-white text-[#6f7276]')}>{h.gender}</span>
                    </span>
                    <span className="text-xs font-semibold text-[#6f7276]" title={`${h.used} of ${h.total} rooms`}>
                      {percent}% full
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-white">
                    <div className="h-full rounded bg-[#ff9193]" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })
          )}
        </article>

        <article className={cx(card, 'flex flex-col gap-4 border-white p-5')}>
          <h2 className={cardTitle}>Live Allocation Feed</h2>
          {feed.length === 0 ? (
            <p className={mutedBox}>Allocations and admin changes will show here.</p>
          ) : (
            feed.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg bg-[#f8fafc] px-3 py-3.5">
                <i className={cx('mt-1 size-2.5 flex-none rounded-full', DOT_COLOURS[a.action] ?? 'bg-[#94a3b8]')} />
                <p className="min-w-0 text-[13px] text-[#6f7276]">
                  {roleLabel(a.role)} {a.actor} {a.action.toLowerCase()}: {a.details}
                  <time className="mt-0.5 block text-[11px] text-[#94a3b8]">{formatLogTime(a.time)}</time>
                </p>
              </div>
            ))
          )}
        </article>
      </div>
    </div>
  )
}
