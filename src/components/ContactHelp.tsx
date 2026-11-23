import type { Contact } from '../../shared/types.ts'
import { useApp } from '../store.tsx'
import Modal from './Modal.tsx'

const column = 'min-h-[292px] bg-[#666] px-3 py-4 shadow-[inset_0_4px_4px_rgb(0_0_0/0.25),0_4px_4px_rgb(0_0_0/0.25)]'
const heading = 'mb-5 text-center text-[32px] font-bold underline'

function ContactList({ contacts, empty }: { contacts: Contact[]; empty: string }) {
  if (contacts.length === 0) return <p className="px-2 text-lg text-black/70">{empty}</p>
  return (
    <ul className="space-y-2 px-2 text-2xl">
      {contacts.map((c) => (
        <li key={`${c.name}-${c.phone}`}>
          {c.name} <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
          {c.role === 'volunteer' && <small className="block text-sm text-black/70">{c.desk}</small>}
        </li>
      ))}
    </ul>
  )
}

// Phone numbers of admins and desk volunteers (admins add them under Volunteers → Create Volunteer Account)
export default function ContactHelp({ onClose }: { onClose: () => void }) {
  const { data } = useApp()
  const admins = data.contacts.filter((c) => c.role === 'admin')
  const supervisors = data.contacts.filter((c) => c.role === 'volunteer' && c.desk !== 'Unassigned')

  return (
    <Modal onClose={onClose} className="max-w-[1128px] rounded-[10px] bg-panel-dark px-[27px] pb-[26px] pt-3">
      <button onClick={onClose} aria-label="Close" className="absolute right-[18px] top-3.5 grid size-9 place-items-center">
        <img src="/assets/close-white.svg" alt="" className="size-[26px]" />
      </button>
      <h2 className="mb-4 text-center text-[36px] font-bold">Contact Help</h2>
      <div className="grid grid-cols-2 gap-[clamp(24px,13vw,190px)] max-lg:grid-cols-1">
        <article className={column}>
          <h3 className={heading}>Admins:</h3>
          <ContactList contacts={admins} empty="No admin phone numbers yet." />
        </article>
        <article className={column}>
          <h3 className={heading}>Hostel supervisors</h3>
          <ContactList contacts={supervisors} empty="No hall desk supervisors with phone numbers yet." />
        </article>
      </div>
    </Modal>
  )
}
