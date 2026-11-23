import { formatRooms } from '../../shared/allocation.ts'
import type { AppData } from '../../shared/types.ts'

// CSV download for the admin (opens in Excel or Google Sheets)

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  // ﻿ tells Excel the file is UTF-8 (so names like "Côte d'Ivoire" show correctly)
  const csv = '﻿' + rows.map((row) => row.map(cell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Master Allocation Manifest: one row per delegate group, with hall and room numbers
export function exportMasterSheet(data: AppData) {
  const hallName = (id: number | null) => data.hostels.find((h) => h.id === id)?.name ?? ''
  const rows: (string | number)[][] = [['Country', 'Gender', 'State / Region', 'Province', 'Coordinator', 'People', 'Hall', 'Rooms', 'Status']]
  for (const c of data.countries) {
    for (const g of c.groups) {
      rows.push([
        c.name,
        g.gender,
        g.region,
        g.province,
        g.coordinator,
        g.count,
        hallName(g.allocatedHostelId ?? g.hostelId),
        formatRooms(g.rooms),
        g.rooms.length ? 'Allocated' : 'Pending',
      ])
    }
  }
  downloadCsv(`shiloh-master-sheet-${new Date().toISOString().slice(0, 10)}.csv`, rows)
}
