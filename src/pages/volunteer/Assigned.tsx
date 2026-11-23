import { useNavigate } from 'react-router-dom'
import CountryCard from '../../components/CountryCard.tsx'
import { useApp } from '../../store.tsx'
import { countryGrid, pageTitle } from '../../ui.ts'

export default function Assigned() {
  const { data } = useApp()
  const navigate = useNavigate()
  const assigned = data.countries.filter((c) => c.assigned)

  return (
    <>
      <h1 className={pageTitle}>Assigned</h1>

      {assigned.length === 0 ? (
        <div className="flex min-h-[470px] flex-col items-center justify-center gap-[26px] text-center">
          <button onClick={() => navigate('/volunteer/assign')} aria-label="Go to Assign" className="plus-circle size-[124px]" />
          <p className="max-w-[560px] text-[32px] leading-[1.3]">No country assigned yet. Complete an allocation on the Assign page.</p>
        </div>
      ) : (
        <div className={countryGrid}>
          {assigned.map((country) => (
            <CountryCard key={country.id} country={country} onClick={() => navigate(`/volunteer/assigned/${country.id}`)} />
          ))}
        </div>
      )}
    </>
  )
}
