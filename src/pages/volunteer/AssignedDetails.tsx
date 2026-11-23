import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatRooms, genderCounts, peopleCount, wingsOf } from '../../../shared/allocation.ts'
import { GroupRows } from '../../components/CountryPanel.tsx'
import PrintSlip from '../../components/PrintSlip.tsx'
import { useApp } from '../../store.tsx'
import { blueButton, cx, outlineButton, pageTitle, pill, redButton } from '../../ui.ts'

const infoCard = 'flex min-w-0 flex-col gap-2 rounded-xl border border-[#e2e8f0] bg-white p-[18px]'
const cardLabel = 'text-xs font-semibold uppercase text-[#64748b]'
const cardValue = 'truncate text-xl font-bold'

// Report-style page for an allocated country (the "Assigned Page - Country Details" screen)
export default function AssignedDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, notePrinted } = useApp()
  const country = data.countries.find((c) => c.id === Number(id))
  const [selectedId, setSelectedId] = useState(country?.groups[0]?.id ?? 0)
  const [printing, setPrinting] = useState(false)

  if (!country) {
    return (
      <>
        <h1 className={pageTitle}>Assigned</h1>
        <p className="mb-5 text-[22px]">This country was not found.</p>
        <button onClick={() => navigate('/volunteer/assigned')} className={cx(redButton, 'px-6 py-2.5 text-2xl')}>
          Back to Assigned
        </button>
      </>
    )
  }

  const group = country.groups.find((g) => g.id === selectedId) ?? country.groups[0]
  const hallName = (hostelId: number | null) => data.hostels.find((h) => h.id === hostelId)?.name
  const counts = genderCounts(country)

  return (
    <div className="report-page font-inter text-[#0f172a]">
      <header className="mb-5 flex flex-wrap items-center gap-x-3.5 gap-y-3">
        <h1 className="text-2xl font-bold">
          <button onClick={() => navigate('/volunteer/assigned')} className="hover:underline">
            Assigned
          </button>{' '}
          / {country.name} Details
        </h1>
        <span className={cx(pill, 'px-3.5 py-1.5 text-[13px]', country.assigned ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-amber-100 text-amber-800')}>
          Status: {country.assigned ? 'Fully Allocated' : 'Changed — not allocated'}
        </span>
        <div className="ml-auto flex gap-2.5">
          <button onClick={() => navigate(`/volunteer/assign/${country.id}`)} className={outlineButton}>
            Edit Allocation
          </button>
          <button onClick={() => setPrinting(true)} disabled={!country.assigned} className={blueButton}>
            Print Allocation PDF
          </button>
        </div>
      </header>

      {!country.assigned && (
        <p className="mb-5 rounded-lg bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800">
          This country was changed after it was allocated. Click “Edit Allocation” and complete the allocation again.
        </p>
      )}

      <div className="mb-4 grid grid-cols-3 gap-3.5 max-xl:grid-cols-1">
        <article className={infoCard}>
          <small className={cardLabel}>Allocated Hall &amp; Rooms</small>
          <b className={cardValue}>{hallName(group?.allocatedHostelId ?? null) ?? 'Not allocated'}</b>
          <span className="truncate text-sm font-medium text-[#0d9488]">
            {group?.rooms.length ? `Block / Wing ${wingsOf(group.rooms).join(', ')} • Rooms ${formatRooms(group.rooms)}` : 'No rooms yet'}
          </span>
        </article>
        <article className={infoCard}>
          <small className={cardLabel}>Coordinator &amp; Region</small>
          <b className={cardValue}>{group?.coordinator}</b>
          <span className="truncate text-sm font-medium text-[#475569]">
            {group?.region} • Province {group?.province}
          </span>
        </article>
        <article className={infoCard}>
          <small className={cardLabel}>Total Attendees</small>
          <b className={cardValue}>{peopleCount(country)} Attendees</b>
          <span className="text-sm font-medium text-[#4f46e5]">
            Male: {counts.Male} • Female: {counts.Female}
          </span>
        </article>
      </div>

      <section className="rounded-xl border border-[#e2e8f0] bg-white px-4 pb-4 pt-[18px]">
        <h2 className="mb-3 text-sm font-semibold">All {country.name} Delegates &amp; Regional Distribution</h2>
        <div className="mx-auto max-w-[1000px]">
          <GroupRows country={country} hostels={data.hostels} selectedId={group?.id} onSelect={(g) => setSelectedId(g.id)} />
        </div>
      </section>

      {printing && (
        <PrintSlip country={country} hostels={data.hostels} onPrint={() => void notePrinted(country.id)} onClose={() => setPrinting(false)} />
      )}
    </div>
  )
}
