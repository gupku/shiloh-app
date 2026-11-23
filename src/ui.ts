// Tailwind class names that are used in many places, so they only need changing once

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

// ---------- Volunteer portal ----------
export const titleText = 'text-[64px] font-bold leading-[1.05] max-lg:text-[44px]'
export const pageTitle = `${titleText} mb-[30px] lg:pl-9 max-lg:mb-6` // Assign / Assigned pages
export const redButton = 'rounded-[5px] bg-brand-strong font-bold text-white shadow-figma hover:enabled:bg-[#e00000]'
export const greenButton =
  'min-w-[248px] self-start rounded-[10px] bg-go px-3.5 py-0.5 text-xl font-bold leading-[1.4] text-black shadow-figma hover:enabled:brightness-105'
export const chip = 'inline-block max-w-full truncate rounded-[10px] bg-white px-2.5 py-[5px] align-middle shadow-chip'
export const errorText = 'text-[15px] font-bold text-[#8b1114]'
export const countryGrid = 'grid grid-cols-[repeat(auto-fill,282px)] gap-x-[clamp(40px,9vw,164px)] gap-y-12'

// Grey country panel
export const panel = 'bg-[rgb(217_217_217/0.8)] shadow-figma'
export const panelBody = 'grid grid-cols-[1.1fr_0.9fr] gap-x-[42px] gap-y-6 px-[30px] pb-7 pt-[30px] max-xl:grid-cols-1'
export const infoList =
  'grid grid-cols-[190px_1fr] items-center gap-x-10 gap-y-4 text-[28px] max-lg:grid-cols-1 max-lg:gap-y-1.5 max-lg:text-[22px] [&_dd]:min-w-0 [&_dd]:text-center [&_dt]:font-bold max-lg:[&_dd]:mb-2.5 max-lg:[&_dd]:text-left'
export const roomInfo = 'flex min-w-0 flex-col gap-[22px] text-[28px] max-lg:text-[22px]'
export const roomRow = 'flex min-w-0 items-center justify-between gap-5'

// Form inputs (dark volunteer popups / white admin popups)
export const darkInput =
  'h-[38px] w-full max-w-[258px] rounded-[5px] bg-white px-3 text-base font-normal text-black outline-none focus:ring-[3px] focus:ring-white/50'
export const wideLightInput =
  'h-[38px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 font-inter text-[13px] font-normal text-[#334155] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-[3px] focus:ring-[#2563eb]/15'
export const lightInput = `${wideLightInput} max-w-[258px]`

// ---------- Admin portal (Inter, from the admin Figma screens) ----------
export const adminTitle = 'font-inter text-[28px] font-bold leading-[1.2] text-[#0f172a]'
export const adminSubtitle = 'mt-1 font-inter text-sm text-[#64748b]'
export const blueButton =
  'inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-[18px] py-2.5 font-inter text-sm font-semibold text-white hover:enabled:bg-[#1d4ed8]'
export const outlineButton =
  'rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-[9px] font-inter text-xs font-semibold text-[#334155] hover:enabled:bg-slate-50'
export const smallButton =
  'rounded-[7px] border border-[#cbd5e1] bg-white px-2.5 py-[7px] font-inter text-[11px] font-semibold text-[#334155] hover:enabled:bg-slate-50'
export const smallDangerButton =
  'rounded-[7px] border border-[#fecaca] bg-white px-2.5 py-[7px] font-inter text-[11px] font-semibold text-[#b91c1c] hover:enabled:bg-red-50'
export const softBlueButton = 'rounded-lg bg-[#eff6ff] px-3 py-2 font-inter text-xs font-semibold text-[#2563eb] hover:bg-[#dbeafe]'
export const card = 'rounded-xl border border-[#e2e8f0] bg-white shadow-card'
export const cardTitle = 'font-inter text-lg font-semibold text-[#35405b]'
export const pill = 'inline-flex w-fit items-center whitespace-nowrap rounded-full px-2.5 py-[5px] font-inter text-xs font-semibold'
export const tableHead = 'font-inter text-[11px] font-semibold text-[#64748b]'
export const mutedBox = 'rounded-lg bg-[#f8fafc] p-6 text-center font-inter text-sm text-[#64748b]'
export const adminError = 'mb-4 rounded-lg bg-red-50 px-4 py-2.5 font-inter text-sm font-semibold text-red-700'
