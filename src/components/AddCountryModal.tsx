import { useState } from 'react'
import { hallUsage } from '../../shared/allocation.ts'
import type { AppData, Gender, NewCountry } from '../../shared/types.ts'
import { COUNTRIES } from '../data/countries.ts'
import { darkInput } from '../ui.ts'
import Flag from './Flag.tsx'
import FormModal, { Field } from './FormModal.tsx'

interface AddCountryModalProps {
  data: AppData
  onClose: () => void
  onSave: (form: NewCountry) => Promise<string> // returns an error message, or ''
}

// The first group's gender comes from the hall picked (or "choose later" for men / women)
export default function AddCountryModal({ data, onClose, onSave }: AddCountryModalProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const selected = COUNTRIES.find((c) => c.code === code)
  const openHalls = data.hostels.filter((h) => !h.blocked)

  async function handleSubmit(form: FormData) {
    const text = (field: string) => String(form.get(field) ?? '').trim()
    const count = Number(form.get('count'))
    const hall = String(form.get('hall') ?? 'later-Male')
    const chosenHall = openHalls.find((h) => String(h.id) === hall)

    if (!selected) return setError('Choose a country.')
    if (!text('state') || !text('coordinator') || !text('province')) return setError('Please fill in every field.')
    if (!Number.isInteger(count) || count < 1) return setError('People count must be a whole number of at least 1.')

    setError(
      await onSave({
        code,
        name: selected.name,
        state: text('state'),
        coordinator: text('coordinator'),
        province: text('province'),
        count,
        gender: chosenHall?.gender ?? (hall === 'later-Female' ? 'Female' : 'Male'),
        hostelId: chosenHall?.id ?? null,
      }),
    )
  }

  return (
    <FormModal error={error} submitLabel="Save" onClose={onClose} onSubmit={handleSubmit}>
      <Field
        label={
          <span className="flex items-center gap-2.5">
            Country
            {selected && <Flag code={code} name={selected.name} className="size-[26px]" />}
          </span>
        }
      >
        <select value={code} onChange={(e) => setCode(e.target.value)} required className={darkInput}>
          <option value="">Select a country</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="State">
        <input name="state" required placeholder="e.g. Greater Accra" className={darkInput} />
      </Field>

      <Field label="Coordinator">
        <input name="coordinator" required placeholder="e.g. Kofi Mensah" className={darkInput} />
      </Field>

      <Field label="Province">
        <input name="province" required placeholder="e.g. 45" className={darkInput} />
      </Field>

      <Field label="People Count">
        <input name="count" type="number" min="1" step="1" required placeholder="e.g. 21" className={darkInput} />
      </Field>

      <Field label="Hall">
        <select name="hall" defaultValue="later-Male" className={darkInput}>
          {(['Male', 'Female'] as Gender[]).map((gender) => (
            <optgroup key={gender} label={`${gender} halls`}>
              {openHalls
                .filter((h) => h.gender === gender)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {hallUsage(data.countries, h).free} rooms free
                  </option>
                ))}
              <option value={`later-${gender}`}>Choose later ({gender.toLowerCase()} delegates)</option>
            </optgroup>
          ))}
        </select>
      </Field>
    </FormModal>
  )
}
