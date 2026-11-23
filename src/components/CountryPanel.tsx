import { formatRooms, peopleCount } from '../../shared/allocation.ts'
import type { Country, DelegateGroup, Hostel } from '../../shared/types.ts'
import { cx } from '../ui.ts'
import Flag from './Flag.tsx'

// Top bar of the grey country panel: flag, name, total people and back button
export function PanelHeader({ country, onBack }: { country: Country; onBack: () => void }) {
  return (
    <header className="flex min-h-[85px] items-center justify-between gap-4 bg-white/60 px-3.5 py-2.5 shadow-[0_4px_4px_rgb(0_0_0/0.2)]">
      <div className="flex items-center gap-2">
        <Flag code={country.code} name={country.name} className="size-[55px]" />
        <div>
          <b className="block text-[27px] leading-[1.1] [text-shadow:0_4px_4px_rgb(0_0_0/0.25)]">{country.name}</b>
          <small className="text-xs">
            <span className="underline">Total Arrived:</span> <b>{peopleCount(country)}</b> attendees
          </small>
        </div>
      </div>
      <button
        onClick={onBack}
        aria-label="Back"
        className="mr-8 grid size-[51px] flex-none place-items-center rounded-full bg-white text-[32px] leading-none shadow-figma hover:bg-slate-50 max-lg:mr-0"
      >
        &lt;
      </button>
    </header>
  )
}

const row = 'grid min-w-[640px] grid-cols-[1.25fr_1.1fr_0.6fr_1.1fr_0.9fr_28px] items-center gap-3 rounded-lg px-4 font-inter text-[15px]'
const miniTag = 'ml-1.5 inline-block rounded-full px-1.5 py-px align-middle text-[10px] font-bold'

interface GroupRowsProps {
  country: Country
  hostels: Hostel[]
  selectedId?: number
  onSelect?: (group: DelegateGroup) => void
  onRemove?: (group: DelegateGroup) => void // shows a remove (×) button on the selected group (not the first one)
}

// A country's delegate groups: region, coordinator, people, hall and rooms. Click a row to select it.
export function GroupRows({ country, hostels, selectedId, onSelect, onRemove }: GroupRowsProps) {
  const hallName = (id: number | null) => hostels.find((h) => h.id === id)?.name

  return (
    <div className="overflow-x-auto rounded-2xl bg-[#e6e6e6] px-3.5 py-3 shadow-[inset_0_4px_4px_rgb(0_0_0/0.12)]">
      {country.groups.map((group) => {
        const selected = group.id === selectedId
        return (
          <div
            key={group.id}
            onClick={() => onSelect?.(group)}
            className={cx(row, 'min-h-12 py-1.5 [&+&]:mt-1', onSelect && 'cursor-pointer', selected ? 'bg-white' : onSelect && 'hover:bg-white/50')}
          >
            <span className="relative min-w-0 break-words">
              {selected && <b className="absolute -left-3.5 text-[#ff0004]">&gt;</b>}
              <span className={cx(selected && 'font-semibold')}>{group.region}</span>
              <em className={cx(miniTag, 'not-italic', group.gender === 'Male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700')}>
                {group.gender === 'Male' ? 'M' : 'F'}
              </em>
              {group.specialNeeds && <em className={cx(miniTag, 'bg-amber-100 not-italic text-amber-800')}>Special needs</em>}
            </span>
            <span className="truncate font-semibold">{group.coordinator}</span>
            <span className="w-fit rounded-full bg-white px-2.5 py-1 text-sm font-bold shadow-[0_1px_2px_rgb(0_0_0/0.15)]">{group.count}</span>
            <span className="truncate text-[#475569]">{hallName(group.allocatedHostelId ?? group.hostelId) ?? 'No hall yet'}</span>
            <span className="truncate font-semibold" title={formatRooms(group.rooms)}>
              {group.rooms.length ? formatRooms(group.rooms) : 'Pending'}
            </span>
            <span>
              {onRemove && selected && !group.main && (
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemove(group)
                  }}
                  aria-label={`Remove ${group.region}`}
                  title="Remove this group"
                  className="size-7 rounded-full text-xl leading-none text-red-700 hover:bg-red-100"
                >
                  ×
                </button>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
