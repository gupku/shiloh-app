// Dashed "nothing here yet" box used on the admin pages
export default function EmptyBox({ title, text, onAdd, addLabel }: { title: string; text: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-[42px] text-center">
      {onAdd && <button onClick={onAdd} aria-label={addLabel} className="plus-circle size-[74px]" />}
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-slate-500">{text}</p>
    </div>
  )
}
