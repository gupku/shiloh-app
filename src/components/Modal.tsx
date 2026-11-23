import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../ui.ts'

interface ModalProps {
  onClose: () => void
  className?: string // the box's size and colours
  children: ReactNode
}

// Dark background + centred box. Closes on Esc or when you click outside the box.
// Drawn straight into <body> so it sits above everything (and prints cleanly).
export default function Modal({ onClose, className, children }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="overlay fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/50 p-6" onMouseDown={onClose}>
      <div className={cx('relative w-full', className)} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
