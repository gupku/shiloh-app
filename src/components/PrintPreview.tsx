import type { ReactNode } from 'react'
import { blueButton, cx, outlineButton } from '../ui.ts'
import Modal from './Modal.tsx'

interface PrintPreviewProps {
  onClose: () => void
  onPrint?: () => void
  className?: string // the sheet's padding / size
  children: ReactNode
}

// Shows a printable sheet. "Print / Save as PDF" opens the browser's print dialog (choose "Save as PDF" there).
// Only the sheet is printed (see the @media print rules in index.css).
export default function PrintPreview({ onClose, onPrint, className, children }: PrintPreviewProps) {
  return (
    <Modal onClose={onClose} className="max-w-[640px]">
      <div className="slip-actions mb-3 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            onPrint?.()
            window.print()
          }}
          className={blueButton}
        >
          Print / Save as PDF
        </button>
        <button onClick={onClose} className={outlineButton}>
          Close
        </button>
      </div>
      <div className={cx('slip bg-white font-inter text-[#0f172a] shadow-figma', className)}>{children}</div>
    </Modal>
  )
}

// Church crest + Youth Alive logo at the top of printed sheets
export function PrintLogos() {
  return (
    <div className="flex items-center justify-center gap-[clamp(40px,22%,140px)]">
      <img src="/assets/crest-print.png" alt="Living Faith Church crest" className="h-[90px] w-auto" />
      <img src="/assets/youth-alive.png" alt="Youth Alive logo" className="h-[80px] w-auto" />
    </div>
  )
}
