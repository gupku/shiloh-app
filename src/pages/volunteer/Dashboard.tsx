import { useState } from 'react'
import { hallUsage } from '../../../shared/allocation.ts'
import HallsModal from '../../components/HallsModal.tsx'
import OccupiedModal from '../../components/OccupiedModal.tsx'
import { useApp } from '../../store.tsx'
import { cx, titleText } from '../../ui.ts'

function Stat({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const text = value.toLocaleString()
  const size = text.length > 7 ? 'text-[32px]' : text.length > 5 ? 'text-[44px]' : text.length > 3 ? 'text-[56px]' : 'text-[77px]'
  const content = (
    <>
      <b className="mb-1 block text-2xl leading-[1.2]">{label}</b>
      <span
        className={cx(
          'flex h-[94px] w-[271px] items-center justify-center bg-stat font-bold text-white shadow-figma group-hover:bg-[#b0b0b0]',
          size,
        )}
      >
        {text}
      </span>
    </>
  )
  return onClick ? (
    <button onClick={onClick} className="group text-left">
      {content}
    </button>
  ) : (
    <div>{content}</div>
  )
}

export default function VolunteerDashboard() {
  const { data } = useApp()
  const [popup, setPopup] = useState<'' | 'halls' | 'occupied'>('')

  const halls = data.hostels.map((h) => ({ ...h, ...hallUsage(data.countries, h) }))
  const openHalls = halls.filter((h) => !h.blocked && h.free > 0)
  const occupiedHalls = halls.filter((h) => h.used > 0)
  const availableRooms = openHalls.reduce((sum, h) => sum + h.free, 0)
  const occupiedRooms = halls.reduce((sum, h) => sum + h.used, 0)

  return (
    <>
      <h1 className={cx(titleText, 'mb-[52px] mt-[45px] max-lg:mb-[30px] max-lg:mt-0')}>Overview</h1>

      <div className="grid grid-cols-[repeat(auto-fill,271px)] gap-x-[60px] gap-y-[50px] xl:grid-cols-[repeat(3,271px)] min-[1400px]:ml-[138px] min-[1400px]:gap-x-[107px] min-[1400px]:gap-y-[60px]">
        <Stat label="Available rooms" value={availableRooms} />
        <Stat label="Occupied Rooms" value={occupiedRooms} />
        <Stat label="Registered Countries" value={data.countries.length} />
        <Stat label="Available halls" value={openHalls.length} onClick={() => setPopup('halls')} />
        <Stat label="Occupied Halls" value={occupiedHalls.length} onClick={() => setPopup('occupied')} />
      </div>

      {popup === 'halls' && <HallsModal halls={openHalls} countries={data.countries} onClose={() => setPopup('')} />}
      {popup === 'occupied' && <OccupiedModal halls={occupiedHalls} onClose={() => setPopup('')} />}
    </>
  )
}
