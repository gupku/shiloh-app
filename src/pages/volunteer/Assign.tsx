import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NewCountry } from '../../../shared/types.ts'
import AddCountryModal from '../../components/AddCountryModal.tsx'
import CountryCard from '../../components/CountryCard.tsx'
import { useApp } from '../../store.tsx'
import { countryGrid, cx, redButton, titleText } from '../../ui.ts'

export default function Assign() {
  const { data, addCountry } = useApp()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  async function handleSave(form: NewCountry) {
    const result = await addCountry(form)
    if (result.error) return result.error
    setAdding(false)
    navigate(`/volunteer/assign/${result.id}`)
    return ''
  }

  return (
    <>
      <div className="mb-[30px] flex flex-wrap items-center justify-between gap-5 lg:pl-9 max-lg:mb-6">
        <h1 className={titleText}>Assign</h1>
        {data.countries.length > 0 && (
          <button onClick={() => setAdding(true)} className={cx(redButton, 'px-6 py-2.5 text-2xl')}>
            + Add Country
          </button>
        )}
      </div>

      {data.countries.length === 0 ? (
        <div className="flex min-h-[600px] flex-col items-center justify-center gap-[26px] text-center">
          <button onClick={() => setAdding(true)} aria-label="Add country" className="plus-circle size-[124px]" />
          <p className="max-w-[560px] text-[32px] leading-[1.3]">No Country added, please add a country to continue.</p>
        </div>
      ) : (
        <div className={countryGrid}>
          {data.countries.map((country) => (
            <CountryCard key={country.id} country={country} onClick={() => navigate(`/volunteer/assign/${country.id}`)} />
          ))}
        </div>
      )}

      {adding && <AddCountryModal data={data} onClose={() => setAdding(false)} onSave={handleSave} />}
    </>
  )
}
