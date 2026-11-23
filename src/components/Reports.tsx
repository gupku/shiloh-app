import { formatRooms, genderCounts, listRooms, peopleCount, usedRooms } from '../../shared/allocation.ts'
import type { AppData } from '../../shared/types.ts'
import { cx } from '../ui.ts'
import PrintPreview, { PrintLogos } from './PrintPreview.tsx'

const th = 'h-[29px] bg-[#f8fafc] px-2.5 text-left text-[10px] font-semibold text-[#64748b]'
const td = 'border-t border-[#f1f5f9] px-2.5 py-1.5 text-[11px] font-medium text-[#334155]'
const printedOn = () => new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

// "Hostel Door Lists": one page per hall listing every allocated room, for hall wardens and security
export function DoorLists({ data, onClose }: { data: AppData; onClose: () => void }) {
  return (
    <PrintPreview onClose={onClose} className="px-9 py-7">
      {data.hostels.length === 0 && <p className="text-center text-sm text-[#64748b]">No hostels yet.</p>}
      {data.hostels.map((hall, index) => {
        const taken = usedRooms(data.countries, hall.id)
        const owner = new Map<string, { country: string; region: string; coordinator: string; count: number }>()
        for (const country of data.countries) {
          for (const group of country.groups) {
            if (group.allocatedHostelId !== hall.id) continue
            for (const room of group.rooms) owner.set(room, { country: country.name, region: group.region, coordinator: group.coordinator, count: group.count })
          }
        }
        const rooms = listRooms(hall).filter((room) => taken.has(room.id))
        return (
          <section key={hall.id} className={cx(index > 0 && 'page-break mt-10 border-t border-dashed border-[#cbd5e1] pt-8 print:mt-0 print:border-0 print:pt-0')}>
            <h1 className="text-center text-lg font-bold">{hall.name.toUpperCase()} — DOOR LIST</h1>
            <p className="text-center text-[11px] font-medium text-[#64748b]">
              {hall.gender} only • {rooms.length} of {listRooms(hall).length} rooms occupied {hall.blocked && '• BLOCKED'} • Printed {printedOn()}
            </p>
            {rooms.length === 0 ? (
              <p className="mt-6 rounded-lg bg-[#f8fafc] p-4 text-center text-[11px] text-[#64748b]">No rooms allocated in this hall yet.</p>
            ) : (
              <table className="mt-4 w-full overflow-hidden rounded-lg border border-[#e2e8f0]">
                <thead>
                  <tr>
                    <th className={th}>Room</th>
                    <th className={th}>Country</th>
                    <th className={th}>Region / Coordinator</th>
                    <th className={cx(th, 'text-right')}>Group size</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const info = owner.get(room.id)
                    return (
                      <tr key={room.id}>
                        <td className={cx(td, 'font-semibold text-[#0f172a]')}>{room.id}</td>
                        <td className={td}>{info?.country}</td>
                        <td className={td}>
                          {info?.region} — {info?.coordinator}
                        </td>
                        <td className={cx(td, 'text-right')}>{info?.count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        )
      })}
    </PrintPreview>
  )
}

// "Country Coordinator Directory": every country's coordinators with their halls and rooms
export function CoordinatorDirectory({ data, onClose }: { data: AppData; onClose: () => void }) {
  const hallName = (id: number | null) => data.hostels.find((h) => h.id === id)?.name ?? 'No hall yet'

  return (
    <PrintPreview onClose={onClose} className="px-9 py-7">
      <PrintLogos />
      <h1 className="mt-3 text-center text-lg font-bold">COUNTRY COORDINATOR DIRECTORY</h1>
      <p className="text-center text-[11px] font-medium text-[#64748b]">
        {data.countries.length} nation{data.countries.length === 1 ? '' : 's'} • Printed {printedOn()}
      </p>
      <hr className="mt-2.5 border-[#e2e8f0]" />

      {data.countries.length === 0 ? (
        <p className="mt-6 rounded-lg bg-[#f8fafc] p-4 text-center text-[11px] text-[#64748b]">No countries registered yet.</p>
      ) : (
        data.countries.map((country) => {
          const counts = genderCounts(country)
          return (
            <section key={country.id} className="mt-5 break-inside-avoid">
              <h2 className="flex items-baseline justify-between text-[13px] font-semibold">
                {country.name}
                <span className="text-[10px] font-medium text-[#64748b]">
                  {peopleCount(country)} delegates (M {counts.Male} • F {counts.Female}) • {country.assigned ? 'Allocated' : 'Pending'}
                </span>
              </h2>
              <table className="mt-1.5 w-full overflow-hidden rounded-lg border border-[#e2e8f0]">
                <thead>
                  <tr>
                    <th className={th}>Coordinator</th>
                    <th className={th}>Region / Province</th>
                    <th className={th}>Delegates</th>
                    <th className={th}>Hall</th>
                    <th className={cx(th, 'text-right')}>Rooms</th>
                  </tr>
                </thead>
                <tbody>
                  {country.groups.map((g) => (
                    <tr key={g.id}>
                      <td className={cx(td, 'font-semibold text-[#0f172a]')}>{g.coordinator}</td>
                      <td className={td}>
                        {g.region} • {g.province}
                      </td>
                      <td className={td}>
                        {g.count} {g.gender === 'Male' ? 'M' : 'F'}
                      </td>
                      <td className={td}>{hallName(g.allocatedHostelId ?? g.hostelId)}</td>
                      <td className={cx(td, 'text-right')}>{g.rooms.length ? formatRooms(g.rooms) : 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })
      )}
    </PrintPreview>
  )
}
