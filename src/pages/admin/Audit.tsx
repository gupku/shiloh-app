import { useState } from 'react'
import AdminHeader from '../../components/AdminHeader.tsx'
import EmptyBox from '../../components/EmptyBox.tsx'
import { CoordinatorDirectory, DoorLists } from '../../components/Reports.tsx'
import { useApp } from '../../store.tsx'
import { blueButton, card, cx, pill, softBlueButton, tableHead } from '../../ui.ts'
import { exportMasterSheet } from '../../utils/exports.ts'
import { formatLogTime, roleLabel } from '../../utils/format.ts'

const columns = 'grid grid-cols-[140fr_190fr_175fr_475fr_160fr] items-center gap-2 min-w-[980px] px-2.5'

// Status chip for each kind of action
function statusOf(action: string): [label: string, colours: string] {
  if (action === 'Blocked Hall') return ['System Lock', 'bg-[#fef3c7] text-[#b45309]']
  if (['Removed Country', 'Deleted Hostel', 'Deleted Account'].includes(action)) return ['Removed', 'bg-[#fee2e2] text-[#b91c1c]']
  const configChanges = ['Updated Rules', 'Added Hostel', 'Edited Hostel', 'Unblocked Hall', 'Created Account', 'Edited Account', 'Reset Password', 'Activated Account', 'Suspended Account']
  if (configChanges.includes(action)) {
    return ['Config Updated', 'bg-[#dbeafe] text-[#1d4ed8]']
  }
  return ['Success', 'bg-[#f5f5f5] text-[#15803d]']
}

export default function Audit() {
  const { data } = useApp()
  const [report, setReport] = useState<'' | 'doors' | 'directory'>('')

  const exportsList: [title: string, text: string, action: string, onClick: () => void][] = [
    ['Master Allocation Manifest', 'Full database of all delegates, countries & rooms', 'Download Excel', () => exportMasterSheet(data)],
    ['Hostel Door Lists', 'Printable PDF sheets for Hall Wardens & Security', 'Generate PDFs', () => setReport('doors')],
    [
      'Country Coordinator Directory',
      `Contact information & hall locations for all ${data.countries.length} nation${data.countries.length === 1 ? '' : 's'}`,
      'Download PDF',
      () => setReport('directory'),
    ],
  ]

  return (
    <div className="font-inter">
      <AdminHeader title="Audit Logs & Master Reports" subtitle="Real-time activity logs, volunteer tracking, and official Shiloh export documents.">
        <button onClick={() => exportMasterSheet(data)} className={blueButton}>
          Export Full Master Sheet (CSV)
        </button>
      </AdminHeader>

      <div className="mb-5 grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        {exportsList.map(([title, text, action, onClick]) => (
          <article key={title} className={cx(card, 'flex flex-col items-start gap-2.5 p-[18px]')}>
            <h2 className="text-[15px] font-semibold text-[#0f172a]">{title}</h2>
            <p className="text-[13px] text-[#64748b]">{text}</p>
            <button onClick={onClick} className={softBlueButton}>
              {action}
            </button>
          </article>
        ))}
      </div>

      {data.audits.length === 0 ? (
        <EmptyBox title="No activity yet" text="Sign-ins, allocations and admin changes will be listed here." />
      ) : (
        <div className={cx(card, 'overflow-x-auto p-5')}>
          <div className={cx(columns, tableHead, 'h-10')}>
            <span>TIMESTAMP</span>
            <span>PERFORMED BY</span>
            <span>ACTION</span>
            <span>TARGET / DETAILS</span>
            <span>STATUS</span>
          </div>
          {data.audits.map((a) => {
            const [label, colours] = statusOf(a.action)
            return (
              <div key={a.id} className={cx(columns, '-mt-px min-h-[58px] border border-[#e2e8f0] py-2 text-[13px]')}>
                <span className="font-medium text-[#475569]">{formatLogTime(a.time)}</span>
                <span className="truncate font-medium text-[#0f172a]">
                  {a.actor} ({roleLabel(a.role)})
                </span>
                <span className="font-semibold text-[#334155]">{a.action}</span>
                <span className="min-w-0 text-[#475569]">{a.details}</span>
                <span>
                  <span className={cx(pill, 'text-[11px]', colours)}>{label}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {report === 'doors' && <DoorLists data={data} onClose={() => setReport('')} />}
      {report === 'directory' && <CoordinatorDirectory data={data} onClose={() => setReport('')} />}
    </div>
  )
}
