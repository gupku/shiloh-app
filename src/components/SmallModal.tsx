import { useState, type FormEvent, type ReactNode } from 'react'
import { cx, outlineButton } from '../ui.ts'
import Modal from './Modal.tsx'

interface SmallModalProps {
  title: string
  text?: ReactNode
  submitLabel: string
  danger?: boolean
  error?: string
  onClose: () => void
  onSubmit: (form: FormData) => void | Promise<void>
  children?: ReactNode
}

// Small white popup for quick admin actions (block a hall, reset a password)
export default function SmallModal({ title, text, submitLabel, danger, error, onClose, onSubmit, children }: SmallModalProps) {
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await onSubmit(form)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} className="max-w-[460px] rounded-2xl border border-[#e2e8f0] bg-white p-6 font-inter text-[#0f172a]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {text && <div className="text-sm text-[#475569]">{text}</div>}
        {children}
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-1 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className={outlineButton}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className={cx(
              'rounded-lg px-4 py-[9px] text-xs font-semibold text-white',
              danger ? 'bg-[#dc2626] hover:enabled:bg-[#b91c1c]' : 'bg-[#2563eb] hover:enabled:bg-[#1d4ed8]',
            )}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
