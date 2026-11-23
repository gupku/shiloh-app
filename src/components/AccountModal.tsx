import { useState } from 'react'
import type { Hostel, NewAccount, Role } from '../../shared/types.ts'
import { cx, lightInput } from '../ui.ts'
import FormModal, { Field } from './FormModal.tsx'

// A temporary password the admin can read out to the volunteer, e.g. "Shiloh4821!"
export const suggestPassword = () => `Shiloh${Math.floor(1000 + Math.random() * 9000)}!`

// "Desk A (Joshua Hall)", "Desk B (Deborah Hall)" ...
export const deskOptions = (hostels: Hostel[]) => hostels.map((h, i) => `Desk ${String.fromCharCode(65 + (i % 26))} (${h.name})`)

interface AccountModalProps {
  hostels: Hostel[]
  onClose: () => void
  onSave: (account: NewAccount) => Promise<string> // returns an error message, or ''
}

export default function AccountModal({ hostels, onClose, onSave }: AccountModalProps) {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const desks = deskOptions(hostels)

  async function handleSubmit(form: FormData) {
    const text = (field: string) => String(form.get(field) ?? '').trim()
    const account: NewAccount = {
      name: text('name'),
      username: text('username'),
      phone: text('phone'),
      desk: text('desk') || 'Unassigned',
      password: String(form.get('password') ?? ''),
      role: text('role') as Role,
    }
    if (!account.name || !account.username) return setError('Enter the full name and a username.')
    if (/\s/.test(account.username)) return setError('Usernames cannot contain spaces.')
    if (account.password.length < 4) return setError('The password must be at least 4 characters.')
    setError(await onSave(account))
  }

  return (
    <FormModal variant="light" title="Create Volunteer Account" error={error} submitLabel="Create Account" onClose={onClose} onSubmit={handleSubmit}>
      <Field label="Full Name">
        <input name="name" required placeholder="e.g. Sarah Adeyemi" className={lightInput} />
      </Field>
      <Field label="Username">
        <input name="username" required placeholder="e.g. sarah.vol01" autoComplete="off" className={lightInput} />
      </Field>
      <Field label="Phone / WhatsApp Number">
        <input name="phone" type="tel" placeholder="e.g. +234 801 234 5678" className={lightInput} />
      </Field>
      <Field label="Temporary Password">
        <span className="relative block max-w-[258px]">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            defaultValue={suggestPassword()}
            autoComplete="new-password"
            className={cx(lightInput, 'pr-10')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          >
            <img src="/assets/eye.svg" alt="" className="size-[18px]" />
          </button>
        </span>
      </Field>
      <Field label="Assigned Desk / Shift">
        <select name="desk" defaultValue={desks[0] ?? 'Unassigned'} className={cx(lightInput, 'cursor-pointer')}>
          {desks.map((desk) => (
            <option key={desk}>{desk}</option>
          ))}
          <option>Unassigned</option>
        </select>
      </Field>
      <Field label="Account Role">
        <select name="role" defaultValue="volunteer" className={cx(lightInput, 'cursor-pointer')}>
          <option value="volunteer">Volunteer Staff</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
    </FormModal>
  )
}
