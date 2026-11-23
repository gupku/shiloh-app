import { peopleCount } from '../../shared/allocation.ts'
import type { Country } from '../../shared/types.ts'
import { cx } from '../ui.ts'
import Flag from './Flag.tsx'

export default function CountryCard({ country, onClick }: { country: Country; onClick: () => void }) {
  const nameSize = country.name.length > 16 ? 'text-[17px]' : country.name.length > 10 ? 'text-[22px]' : 'text-[32px]'

  return (
    <button
      onClick={onClick}
      className="flex h-[104px] w-[282px] items-center gap-[18px] bg-figma-grey px-[18px] py-2 text-left shadow-figma transition-transform hover:-translate-y-0.5"
    >
      <Flag code={country.code} name={country.name} className="size-[60px]" />
      <span>
        <b className={cx('block leading-none', nameSize)}>{country.name}</b>
        <small className="mt-1.5 block text-sm text-[#444]">
          {peopleCount(country)} delegates · {country.assigned ? 'Assigned' : 'Pending'}
        </small>
      </span>
    </button>
  )
}
