import { formatRooms, genderCounts, peopleCount, wingsOf } from '../../shared/allocation.ts'
import type { Country, Hostel } from '../../shared/types.ts'
import PrintPreview, { PrintLogos } from './PrintPreview.tsx'

const label = 'font-semibold text-[#64748b]'
const value = 'text-right font-medium'

// Printable allocation report for one country (the "Pdf Document" screen in the design)
export default function PrintSlip({ country, hostels, onPrint, onClose }: { country: Country; hostels: Hostel[]; onPrint: () => void; onClose: () => void }) {
  const hallName = (id: number | null) => hostels.find((h) => h.id === id)?.name ?? '—'
  const allocated = country.groups.filter((g) => g.rooms.length)
  const halls = [...new Set(allocated.map((g) => hallName(g.allocatedHostelId)))]
  const rooms = allocated.flatMap((g) => g.rooms)
  const counts = genderCounts(country)
  const main = country.groups.find((g) => g.main)

  const left: [string, string][] = [
    ['Country:', country.name],
    ['Coordinator:', main?.coordinator ?? country.coordinator],
    ['Region:', main?.region ?? country.state],
    ['Province:', main?.province ?? country.province],
  ]
  const right: [string, string][] = [
    ['Allocated Hall:', halls.join(', ') || '—'],
    ['Wing:', rooms.length ? `Block ${wingsOf(rooms).join(', ')}` : '—'],
    ['Rooms:', rooms.length > 3 && formatRooms(rooms).length > 22 ? `${rooms.length} rooms` : formatRooms(rooms) || '—'],
    ['Total:', `${peopleCount(country)} Attendees (M ${counts.Male} • F ${counts.Female})`],
  ]

  return (
    <PrintPreview onClose={onClose} onPrint={onPrint} className="flex min-h-[842px] flex-col px-10 pb-8 pt-6">
      <PrintLogos />
      <h1 className="mt-3 text-center text-lg font-bold">SHILOH HOSTEL ALLOCATION REPORT</h1>
      <p className="text-center text-[11px] font-medium text-[#64748b]">OFFICIAL HALL CLEARANCE &amp; DELEGATE SLIP</p>
      <hr className="mt-2.5 border-[#e2e8f0]" />

      <div className="mt-[18px] grid grid-cols-2 gap-x-3 rounded-lg bg-[#f8fafc] p-3 text-[10px]">
        {[left, right].map((column, index) => (
          <dl key={index} className="grid grid-cols-[auto_1fr] content-start gap-x-2 gap-y-1.5">
            {column.map(([name, text]) => (
              <div key={name} className="contents">
                <dt className={label}>{name}</dt>
                <dd className={value}>{text}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>

      <h2 className="mt-7 text-[13px] font-semibold">Regional Hall Breakdown</h2>
      <div className="mt-2.5 overflow-hidden rounded-lg border border-[#e2e8f0]">
        <table className="w-full text-left">
          <thead className="bg-[#f8fafc] text-[10px] font-semibold text-[#64748b]">
            <tr className="h-[29px]">
              <th className="px-3">Region</th>
              <th className="px-3 text-center">Attendees</th>
              <th className="px-3">Hall</th>
              <th className="px-3 text-right">Room</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-medium text-[#334155]">
            {country.groups.map((g) => (
              <tr key={g.id} className="h-[29px] border-t border-[#f1f5f9]">
                <td className="px-3 py-1">
                  {g.region} <span className="text-[#94a3b8]">({g.gender === 'Male' ? 'M' : 'F'})</span>
                  <small className="block text-[9px] text-[#94a3b8]">{g.coordinator}</small>
                </td>
                <td className="px-3 text-center">{g.count}</td>
                <td className="px-3">{hallName(g.allocatedHostelId)}</td>
                <td className="px-3 text-right">{g.rooms.length ? `Rm ${formatRooms(g.rooms)}` : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-auto flex justify-between gap-6 pt-12 text-[10px] text-[#64748b]">
        <span>Authorized Volunteer Signature: ______________</span>
        <span>Official Shiloh Seal / Stamp</span>
      </footer>
      <p className="mt-2 text-center text-[9px] text-[#94a3b8]">Printed {new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
    </PrintPreview>
  )
}
