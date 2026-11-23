import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatRooms, wingsOf } from '../../../shared/allocation.ts'
import type { DelegateGroup, Gender } from '../../../shared/types.ts'
import AddDelegateModal from '../../components/AddDelegateModal.tsx'
import { GroupRows, PanelHeader } from '../../components/CountryPanel.tsx'
import { useApp } from '../../store.tsx'
import { chip, cx, errorText, greenButton, infoList, pageTitle, panel, panelBody, redButton, roomInfo, roomRow } from '../../ui.ts'

export default function CountryDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, addGroup, setGroupHall, changePeopleCount, removeGroup, completeAllocation, deleteCountry } = useApp()
  const country = data.countries.find((c) => c.id === Number(id))

  // The "active view": a Male / Female tab and the selected group (the panel shows that group)
  const [gender, setGender] = useState<Gender>(country?.groups[0]?.gender ?? 'Male')
  const [selectedId, setSelectedId] = useState(country?.groups[0]?.id ?? 0)
  const [addingGroup, setAddingGroup] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!country) {
    return (
      <>
        <h1 className={pageTitle}>Assign</h1>
        <p className="mb-5 text-[22px]">This country was not found.</p>
        <button onClick={() => navigate('/volunteer/assign')} className={cx(redButton, 'px-6 py-2.5 text-2xl')}>
          Back to Assign
        </button>
      </>
    )
  }

  const countryId = country.id
  const sameGender = country.groups.filter((g) => g.gender === gender)
  const active: DelegateGroup | undefined = sameGender.find((g) => g.id === selectedId) ?? sameGender[0]
  const hallChoices = data.hostels.filter((h) => h.gender === gender && (!h.blocked || h.id === active?.hostelId))
  const roomsText = active ? formatRooms(active.rooms) : ''

  function switchTo(group: DelegateGroup) {
    setGender(group.gender)
    setSelectedId(group.id)
  }

  // Runs a change on the server and shows any error (changes release the country's rooms)
  async function edit(change: () => Promise<string>) {
    setError('')
    setBusy(true)
    const problem = await change()
    setBusy(false)
    if (problem) setError(problem)
  }

  async function handleComplete() {
    if (country?.assigned) return navigate(`/volunteer/assigned/${countryId}`)
    setError('')
    setBusy(true)
    const problem = await completeAllocation(countryId)
    setBusy(false)
    if (problem) setError(problem)
    else navigate(`/volunteer/assigned/${countryId}`)
  }

  async function handleRemove(group: DelegateGroup) {
    if (!window.confirm(`Remove ${group.region} (${group.coordinator})?`)) return
    await edit(() => removeGroup(countryId, group.id))
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${country?.name}? Any rooms it has will be freed.`)) return
    navigate('/volunteer/assign')
    await deleteCountry(countryId)
  }

  return (
    <>
      <h1 className={pageTitle}>Assign</h1>

      <div className={panel}>
        <PanelHeader country={country} onBack={() => navigate('/volunteer/assign')} />

        <div className={panelBody}>
          <dl className={infoList}>
            <dt>State</dt>
            <dd>{active?.region ?? '—'}</dd>

            <dt>Coordinator</dt>
            <dd>{active?.coordinator ?? '—'}</dd>

            <dt>Province</dt>
            <dd className="text-right! max-lg:text-left!">
              <span className={chip}>{active?.province || '—'}</span>
            </dd>

            <dt>People Count</dt>
            <dd className="flex items-center justify-end gap-3 max-lg:justify-start">
              <span className={chip}>{active?.count ?? 0}</span>
              {active &&
                [1, -1].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => edit(() => changePeopleCount(countryId, active.id, amount))}
                    disabled={busy}
                    aria-label={amount > 0 ? 'Add one person' : 'Remove one person'}
                    className="grid size-[26px] place-items-center rounded-[8px] bg-brand-strong text-xl font-bold leading-none text-white shadow-figma"
                  >
                    {amount > 0 ? '+' : '-'}
                  </button>
                ))}
            </dd>

            <dt>Hall</dt>
            <dd>
              {active ? (
                <span className="relative inline-flex max-w-full items-center">
                  <select
                    value={active.hostelId ?? ''}
                    onChange={(e) => edit(() => setGroupHall(countryId, active.id, e.target.value ? Number(e.target.value) : null))}
                    aria-label="Hall"
                    className="max-w-full cursor-pointer appearance-none truncate rounded-md bg-transparent py-0.5 pl-2 pr-8 text-center outline-none hover:bg-white/50 focus:bg-white/60"
                  >
                    <option value="">{hallChoices.length ? 'Select hall' : `No ${gender.toLowerCase()} halls yet`}</option>
                    {hallChoices.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                        {h.blocked ? ' (blocked)' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-1.5 text-base">▾</span>
                </span>
              ) : (
                '—'
              )}
            </dd>
          </dl>

          <div className={roomInfo}>
            <div className={roomRow}>
              <b>Block/ Wing</b>
              <span className={cx(chip, 'min-w-[48px] text-center text-xl font-bold')}>{active?.rooms.length ? wingsOf(active.rooms).join(', ') : '—'}</span>
            </div>
            <div className={roomRow}>
              <b>Rooms</b>
              <span className={cx(chip, 'text-xl font-bold')} title={roomsText}>
                {!active?.rooms.length ? 'Pending' : roomsText.length > 18 ? `${active.rooms.length} rooms` : roomsText}
              </span>
            </div>
            <div className={roomRow}>
              {(['Male', 'Female'] as Gender[]).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setGender(option)
                    setSelectedId(country.groups.find((g) => g.gender === option)?.id ?? 0)
                  }}
                  aria-pressed={gender === option}
                  className={cx(
                    'min-w-[133px] rounded-[10px] px-5 py-1.5 text-2xl font-bold text-white shadow-[0_4px_15px_rgb(0_0_0/0.25),0_4px_4px_rgb(0_0_0/0.25)]',
                    gender === option ? 'bg-brand-soft' : 'bg-brand-strong hover:bg-[#e00000]',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <button onClick={() => setAddingGroup(true)} className={greenButton}>
              + Add new Delegates
            </button>
            <button onClick={handleComplete} disabled={busy} className={cx(redButton, 'w-full p-2 text-[26px]')}>
              {country.assigned ? 'View allocation' : 'Complete allocation'}
            </button>
            {!active && <p className="text-lg">No {gender.toLowerCase()} delegates yet. Use “+ Add new Delegates” to add them.</p>}
            {error && <p className={errorText}>{error}</p>}
          </div>
        </div>

        <section className="mx-[30px] mb-[22px] bg-white/60 px-5 pb-5 pt-3 shadow-sunken max-lg:mx-3 max-lg:px-3">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 text-2xl">
            <b>All {country.name} Delegates</b>
            <span className="text-[22px] max-lg:text-base">Click any row to switch active view</span>
          </div>
          <GroupRows country={country} hostels={data.hostels} selectedId={active?.id} onSelect={switchTo} onRemove={handleRemove} />
        </section>

        <div className="px-[30px] pb-[18px] text-right">
          <button onClick={handleDelete} className="text-[15px] text-red-700 underline">
            Delete this country
          </button>
        </div>
      </div>

      {addingGroup && (
        <AddDelegateModal
          data={data}
          gender={gender}
          defaultHallId={active?.hostelId ?? null}
          onClose={() => setAddingGroup(false)}
          onSave={async (group) => {
            const result = await addGroup(countryId, group)
            if (result.error) return result.error
            setAddingGroup(false)
            if (result.id) setSelectedId(result.id)
            return ''
          }}
        />
      )}
    </>
  )
}
