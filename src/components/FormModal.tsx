import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react'
import { cx } from '../ui.ts'
import Modal from './Modal.tsx'

// dark = volunteer popups, light = white admin popup, glass = see-through admin popup (Add New Hostel)
type Variant = 'dark' | 'light' | 'glass'
const VariantContext = createContext<Variant>('dark')

interface FormModalProps {
  variant?: Variant
  title?: string
  error: string
  submitLabel: string
  onClose: () => void
  onSubmit: (form: FormData) => void | Promise<void>
  children: ReactNode
  footer?: ReactNode // extra content under the save button (e.g. a delete link)
}

const BOXES: Record<Variant, string> = {
  dark: 'max-w-[1266px] bg-panel-dark',
  light: 'max-w-[1156px] rounded-3xl border border-[#e2e8f0] bg-white',
  glass: 'max-w-[1217px] rounded-3xl border border-[#e2e8f0]/70 bg-[#2f2f2f]/90 backdrop-blur-md',
}

// Popup with a form: back arrow, fields in two columns, error message and a red save button
export default function FormModal({ variant = 'dark', title, error, submitLabel, onClose, onSubmit, children, footer }: FormModalProps) {
  const [busy, setBusy] = useState(false)
  const dark = variant === 'dark'

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
    <Modal onClose={onClose} className={cx('min-h-[560px] px-[8%] pb-12', dark ? 'pt-[96px]' : 'pt-[83px]', BOXES[variant])}>
      {title && (
        <h2 className={cx('absolute left-[7.5%] top-[30px] font-inter text-2xl font-bold', variant === 'glass' ? 'text-white' : 'text-[#0f172a]')}>
          {title}
        </h2>
      )}
      <button type="button" onClick={onClose} aria-label="Back" className="absolute right-[6%] top-[18px] transition-transform hover:-translate-x-1">
        <img src="/assets/back-arrow.svg" alt="" className="h-[79px] w-[91px]" />
      </button>

      <VariantContext.Provider value={variant}>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-x-[25%] gap-y-[52px] max-lg:grid-cols-1 max-lg:gap-y-6 max-lg:pt-6"
        >
          {children}
          {error && (
            <p className={cx('col-span-full -mb-6 text-center text-[15px] font-bold', dark ? 'text-[#ffd5d5]' : 'font-inter text-red-600')}>{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="col-span-full mt-4 h-[39px] min-w-[195px] justify-self-center rounded-[5px] bg-save px-4 text-2xl font-bold leading-none text-white hover:enabled:bg-[#e83232]"
          >
            {busy ? 'Saving…' : submitLabel}
          </button>
          {footer && <div className="col-span-full -mt-6 text-center">{footer}</div>}
        </form>
      </VariantContext.Provider>
    </Modal>
  )
}

// A label with its input underneath
export function Field({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  const variant = useContext(VariantContext)
  return (
    <label
      className={cx(
        'flex flex-col',
        variant === 'dark' ? 'gap-1.5 text-[22px] font-bold text-black' : 'gap-2.5 font-inter text-[15px] font-semibold',
        variant === 'light' && 'text-[#334155]',
        variant === 'glass' && 'text-slate-100',
        className,
      )}
    >
      {label}
      {children}
    </label>
  )
}
