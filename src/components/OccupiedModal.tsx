import type { Hostel } from '../../shared/types.ts'
import Modal from './Modal.tsx'

type HallWithUsage = Hostel & { used: number; total: number }

// "Occupied halls" popup: halls that have at least one room in use (rooms used / total rooms)
export default function OccupiedModal({ halls, onClose }: { halls: HallWithUsage[]; onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="max-w-[520px] bg-gradient-to-b from-[#2b2b2b] to-[#3a3a3a] px-3 pb-4 pt-9 text-white shadow-figma">
      <button onClick={onClose} aria-label="Close" className="absolute right-2.5 top-2.5 grid size-7 place-items-center">
        <img src="/assets/close-white.svg" alt="" className="size-[18px]" />
      </button>

      {halls.length === 0 ? (
        <p className="px-4 pb-6 pt-2 text-center text-xl">No rooms are occupied yet.</p>
      ) : (
        halls.map((hall) => (
          <div key={hall.id} className="flex items-center justify-between gap-6 px-2 py-1.5">
            <b className="text-[30px] leading-tight">{hall.name}</b>
            <span className="whitespace-nowrap text-[26px]">
              {hall.used}/{hall.total} Rooms
            </span>
          </div>
        ))
      )}
    </Modal>
  )
}
