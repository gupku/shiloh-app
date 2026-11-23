import { useState } from 'react'
import { wingAvailability } from '../../shared/allocation.ts'
import type { Country, Hostel } from '../../shared/types.ts'
import { cx } from '../ui.ts'
import Modal from './Modal.tsx'

const twoColumns = 'grid grid-cols-[1fr_1.5fr] items-center gap-5'
const numberBox = 'rounded-[5px] bg-[#c7c7c7] text-center text-[26px] font-bold text-white'

// "Available halls" popup: each hall's wings, and free rooms per floor for the chosen wing
export default function HallsModal({ halls, countries, onClose }: { halls: Hostel[]; countries: Country[]; onClose: () => void }) {
  const [openWing, setOpenWing] = useState<Record<number, string>>({}) // hall id -> wing letter

  return (
    <Modal onClose={onClose} className="min-h-[420px] max-w-[1259px] bg-[#858585] px-7 pb-8 pt-[60px]">
      <button onClick={onClose} aria-label="Close" className="absolute right-[18px] top-3.5 grid size-9 place-items-center">
        <img src="/assets/close-white.svg" alt="" className="size-[26px]" />
      </button>

      {halls.length === 0 ? (
        <p className="p-10 text-center text-[22px] text-white">No halls with free rooms right now.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-10">
          {halls.map((hall) => {
            const wings = wingAvailability(countries, hall).filter((w) => w.free > 0)
            const chosen = wings.find((w) => w.wing === openWing[hall.id])
            return (
              <article key={hall.id} className="min-h-[565px] bg-white px-7 py-6 shadow-sunken max-lg:min-h-0">
                <h2 className="text-center text-4xl font-bold leading-[1.1]">{hall.name}</h2>
                <h3 className="mt-1 text-center text-[26px] font-bold underline">Available wings:</h3>

                <div className="mt-[22px] grid grid-cols-[repeat(2,max-content)] justify-center gap-x-[35px] gap-y-6">
                  {wings.map((w) => (
                    <button
                      key={w.wing}
                      onClick={() => setOpenWing({ ...openWing, [hall.id]: chosen?.wing === w.wing ? '' : w.wing })}
                      className={cx('rounded-[5px] px-2.5 py-1 text-2xl', chosen?.wing === w.wing ? 'bg-brand text-white' : 'bg-[#e4e4e4]')}
                    >
                      {w.wing} Wing
                    </button>
                  ))}
                </div>

                {chosen && (
                  <div className="mx-auto mt-6 w-full max-w-[313px] rounded-[5px] border border-black px-[13px] py-[18px]">
                    <div className={cx(twoColumns, 'mb-5 text-[21px] font-bold underline')}>
                      <span>Floor</span>
                      <span>Available rooms</span>
                    </div>
                    {chosen.floors.map((f) => (
                      <div key={f.floor} className={cx(twoColumns, 'mb-3.5')}>
                        <span className={cx(numberBox, 'w-[60px]')}>{f.floor * 100}</span>
                        <span className={cx(numberBox, 'w-[76px]')}>{f.free}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
