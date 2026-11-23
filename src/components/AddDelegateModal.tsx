import { useState } from 'react'
import { hallUsage } from '../../shared/allocation.ts'
import type { AppData, Gender, NewGroup } from '../../shared/types.ts'
import { darkInput } from '../ui.ts'
import FormModal, { Field } from './FormModal.tsx'

interface AddDelegateModalProps {
  data: AppData
  gender: Gender // the Male / Female view the volunteer is on
  defaultHallId: number | null
  onClose: () => void
  onSave: (group: NewGroup) => Promise<string> // returns an error message, or ''
}

// Adds another coordinator's group to a country. Each group gets its own rooms.
export default function AddDelegateModal({ data, gender, defaultHallId, onClose, onSave }: AddDelegateModalProps) {
  const [error, setError] = useState('')
  const halls = data.hostels.filter((h) => !h.blocked && h.gender === gender)

  async function handleSubmit(form: FormData) {
    const text = (field: string) => String(form.get(field) ?? '').trim()
    const count = Number(form.get('count'))
    const hostelId = String(form.get('hostelId') ?? '')

    if (!text('region') || !text('province') || !text('coordinator')) return setError('Please fill in every field.')
    if (!Number.isInteger(count) || count < 1) return setError('People count must be a whole number of at least 1.')

    setError(
      await onSave({
        gender,
        region: text('region'),
        province: text('province'),
        coordinator: text('coordinator'),
        count,
        hostelId: hostelId ? Number(hostelId) : null,
        specialNeeds: form.get('specialNeeds') === 'on',
      }),
    )
  }

  return (
    <FormModal error={error} submitLabel="Save" onClose={onClose} onSubmit={handleSubmit}>
      <p className="col-span-full -mb-6 text-lg font-bold text-white/80">New {gender.toLowerCase()} delegates</p>

      <Field label="State">
        <input name="region" required placeholder="e.g. Ashanti (Kumasi)" className={darkInput} />
      </Field>

      <Field label="Province">
        <input name="province" required placeholder="e.g. 12" className={darkInput} />
      </Field>

      <Field label="Coordinator">
        <input name="coordinator" required placeholder="e.g. Kwame Osei" className={darkInput} />
      </Field>

      <Field label="Hall">
        <select name="hostelId" defaultValue={halls.some((h) => h.id === defaultHallId) ? String(defaultHallId) : ''} className={darkInput}>
          <option value="">{halls.length ? 'Choose later' : `No ${gender.toLowerCase()} halls yet`}</option>
          {halls.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} — {hallUsage(data.countries, h).free} rooms free
            </option>
          ))}
        </select>
      </Field>

      <Field label="People Count">
        <input name="count" type="number" min="1" step="1" required placeholder="e.g. 12" className={darkInput} />
      </Field>

      {data.rules.specialNeeds && (
        <label className="flex items-center gap-2.5 self-end text-lg font-bold text-black">
          <input type="checkbox" name="specialNeeds" className="size-5 accent-[#ff0000]" />
          Special needs (ground floor first)
        </label>
      )}
    </FormModal>
  )
}
