import { useState } from 'react'
import { flagUrl } from '../data/countries.ts'
import { cx } from '../ui.ts'

// Round country flag; shows the country code if the image can't load (e.g. offline)
export default function Flag({ code, name, className }: { code: string; name: string; className: string }) {
  const [failedCode, setFailedCode] = useState('')
  const base = 'flex-none rounded-full shadow-[0_2px_4px_rgb(0_0_0/0.2)]'

  if (!code || failedCode === code) {
    return (
      <span className={cx(base, 'grid place-items-center bg-[#9c9c9c] text-sm font-bold text-white', className)}>
        {(code || name).slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return <img src={flagUrl(code)} alt={`${name} flag`} onError={() => setFailedCode(code)} className={cx(base, 'object-cover', className)} />
}
