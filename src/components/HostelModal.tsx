import { useState } from 'react'
import type { Gender, Hostel, NewHostel } from '../../shared/types.ts'
import { cx, lightInput } from '../ui.ts'
import FormModal, { Field } from './FormModal.tsx'

interface HostelModalProps {
  hostel?: Hostel // given = "Edit Configuration", missing = "Add New Hostel"
  defaultCapacity: number
  onClose: () => void
  onSave: (hostel: NewHostel) => Promise<string> // returns an error message, or ''
  onDelete?: () => void
}

export default function HostelModal({ hostel, defaultCapacity, onClose, onSave, onDelete }: HostelModalProps) {
  const [error, setError] = useState('')

  async function handleSubmit(form: FormData) {
    const number = (field: string) => Number(form.get(field))
    const values: NewHostel = {
      name: String(form.get('name') ?? '').trim(),
      gender: String(form.get('gender')) as Gender,
      wings: number('wings'),
      floors: number('floors'),
      roomsPerFloor: number('roomsPerFloor'),
      capacityPerRoom: number('capacityPerRoom'),
    }
    if (!values.name) return setError('Enter the hostel name.')
    const numbers = [values.wings, values.floors, values.roomsPerFloor, values.capacityPerRoom]
    if (numbers.some((n) => !Number.isInteger(n) || n < 1)) return setError('Numbers must be whole numbers of at least 1.')
    setError(await onSave(values))
  }

  return (
    <FormModal
      variant="glass"
      title={hostel ? `Edit ${hostel.name}` : 'Add New Hostel'}
      error={error}
      submitLabel={hostel ? 'Save Changes' : 'Create Hostel'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        onDelete && (
          <button type="button" onClick={onDelete} className="font-inter text-[13px] font-semibold text-red-300 underline hover:text-red-200">
            Delete this hostel
          </button>
        )
      }
    >
      <Field label="Hostel Name">
        <input name="name" required defaultValue={hostel?.name} placeholder="e.g. Paul Hall" className={lightInput} />
      </Field>
      <Field label="Floors per Wing">
        <input name="floors" type="number" min="1" max="20" step="1" required defaultValue={hostel?.floors} placeholder="e.g. 3 Floors" className={lightInput} />
      </Field>
      <Field label="Gender Classification">
        <select name="gender" defaultValue={hostel?.gender ?? 'Male'} className={cx(lightInput, 'cursor-pointer')}>
          <option value="Male">Male Only</option>
          <option value="Female">Female Only</option>
        </select>
      </Field>
      <Field label="Rooms per Floor">
        <input
          name="roomsPerFloor"
          type="number"
          min="1"
          max="99"
          step="1"
          required
          defaultValue={hostel?.roomsPerFloor}
          placeholder="e.g. 20 Rooms"
          className={lightInput}
        />
      </Field>
      <Field label="Number of Wings">
        <input name="wings" type="number" min="1" max="26" step="1" required defaultValue={hostel?.wings} placeholder="e.g. 4 Wings (A, B, C, D)" className={lightInput} />
      </Field>
      <Field label="Capacity per Room">
        <input
          name="capacityPerRoom"
          type="number"
          min="1"
          max="20"
          step="1"
          required
          defaultValue={hostel?.capacityPerRoom ?? defaultCapacity}
          placeholder="e.g. 5 People / Room"
          className={lightInput}
        />
      </Field>
    </FormModal>
  )
}
