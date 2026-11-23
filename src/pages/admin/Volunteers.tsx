import { useState } from 'react'
import type { Account, NewAccount } from '../../../shared/types.ts'
import AccountModal, { deskOptions, suggestPassword } from '../../components/AccountModal.tsx'
import AdminHeader from '../../components/AdminHeader.tsx'
import EmptyBox from '../../components/EmptyBox.tsx'
import SmallModal from '../../components/SmallModal.tsx'
import { useApp } from '../../store.tsx'
import { adminError, blueButton, card, cx, pill, smallButton, smallDangerButton, tableHead, wideLightInput } from '../../ui.ts'
import { timeAgo } from '../../utils/format.ts'

// Column widths from the design: name, username, desk, status, last active, actions
const columns = 'grid grid-cols-[190fr_165fr_258fr_125fr_155fr_287fr] items-center gap-2 min-w-[980px] px-2.5'
const editLabel = 'flex flex-col gap-2 text-[13px] font-semibold text-[#334155]'

export default function Volunteers() {
  const { data, session, addAccount, editAccount, toggleAccount, resetPassword, deleteAccount } = useApp()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [editError, setEditError] = useState('')
  const [resetting, setResetting] = useState<Account | null>(null)
  const [resetDone, setResetDone] = useState('')
  const [resetError, setResetError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSave(form: NewAccount) {
    const problem = await addAccount(form)
    if (!problem) setAdding(false)
    return problem
  }

  async function handleDelete(account: Account) {
    if (!window.confirm(`Delete ${account.name}'s account? This can't be undone.`)) return
    setMessage(await deleteAccount(account.id))
  }

  function closeReset() {
    setResetting(null)
    setResetDone('')
    setResetError('')
  }

  return (
    <div className="font-inter">
      <AdminHeader title="Volunteer Management" subtitle="Create volunteer accounts, issue login credentials, and assign shift zones.">
        <button onClick={() => setAdding(true)} className={blueButton}>
          <span className="text-lg leading-none">+</span> Create Volunteer Account
        </button>
      </AdminHeader>

      {message && <p className={adminError}>{message}</p>}

      {data.accounts.length === 0 ? (
        <EmptyBox title="No accounts" text="Create an account so a volunteer can sign in." onAdd={() => setAdding(true)} addLabel="Create Volunteer Account" />
      ) : (
        <div className={cx(card, 'overflow-x-auto px-5 py-4')}>
          <div className={cx(columns, tableHead, 'h-[42px]')}>
            <span>VOLUNTEER NAME</span>
            <span>USERNAME</span>
            <span>ASSIGNED ZONE / DESK</span>
            <span>STATUS</span>
            <span>LAST ACTIVE</span>
            <span>ACTIONS</span>
          </div>

          {data.accounts.map((a) => {
            const isMe = a.id === session?.id
            const active = a.status === 'Active'
            return (
              <div key={a.id} className={cx(columns, '-mt-px min-h-16 border border-[#e2e8f0] py-2 text-[13px]')}>
                <span className="min-w-0">
                  <button onClick={() => setEditing(a)} title="Edit name, phone or desk" className="text-left font-semibold text-[#0f172a] hover:underline">
                    {a.name}
                  </button>
                  {a.role === 'admin' && <em className={cx(pill, 'ml-1.5 bg-[#eef2ff] px-2 py-0.5 text-[10px] not-italic text-[#4338ca]')}>ADMIN</em>}
                  {isMe && <small className="ml-1 text-[11px] text-[#64748b]">(you)</small>}
                  {a.phone && <small className="block text-[11px] text-[#64748b]">{a.phone}</small>}
                </span>
                <span className="truncate text-[#475569]">{a.username}</span>
                <span className="truncate text-[#334155]">{a.desk}</span>
                <span>
                  <span className={cx(pill, active ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]')}>{active ? 'Active' : 'Suspended'}</span>
                </span>
                <span className="text-[#64748b]">{timeAgo(a.lastActive)}</span>
                <span className="flex flex-wrap gap-2">
                  {active ? (
                    <>
                      <button onClick={() => setResetting(a)} className={smallButton}>
                        Reset Password
                      </button>
                      {!isMe && (
                        <button onClick={async () => setMessage(await toggleAccount(a.id))} className={smallButton}>
                          Deactivate
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button onClick={async () => setMessage(await toggleAccount(a.id))} className={smallButton}>
                        Activate
                      </button>
                      <button onClick={() => handleDelete(a)} className={smallDangerButton}>
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {adding && <AccountModal hostels={data.hostels} onClose={() => setAdding(false)} onSave={handleSave} />}

      {editing && (
        <SmallModal
          title={`Edit ${editing.name}`}
          submitLabel="Save Changes"
          error={editError}
          onClose={() => {
            setEditing(null)
            setEditError('')
          }}
          onSubmit={async (form) => {
            const text = (field: string) => String(form.get(field) ?? '').trim()
            const problem = await editAccount(editing.id, { name: text('name'), phone: text('phone'), desk: text('desk') })
            setEditError(problem)
            if (!problem) setEditing(null)
          }}
        >
          <label className={editLabel}>
            Full Name
            <input name="name" required defaultValue={editing.name} className={wideLightInput} />
          </label>
          <label className={editLabel}>
            Phone / WhatsApp Number
            <input name="phone" type="tel" defaultValue={editing.phone} placeholder="e.g. +234 801 234 5678" className={wideLightInput} />
          </label>
          <label className={editLabel}>
            Assigned Desk / Shift
            <select name="desk" defaultValue={editing.desk} className={wideLightInput}>
              {[...new Set([...deskOptions(data.hostels), 'Unassigned', editing.desk])].map((desk) => (
                <option key={desk}>{desk}</option>
              ))}
            </select>
          </label>
        </SmallModal>
      )}

      {resetting &&
        (resetDone ? (
          <SmallModal
            title="Password reset"
            text={
              <>
                Give <b>{resetting.name}</b> their new password: <b className="font-mono text-[#0f172a]">{resetDone}</b>. They have been signed out of
                other devices.
              </>
            }
            submitLabel="Done"
            onClose={closeReset}
            onSubmit={closeReset}
          />
        ) : (
          <SmallModal
            title={`Reset password for ${resetting.name}`}
            text="Set a new temporary password and share it with them."
            submitLabel="Reset Password"
            error={resetError}
            onClose={closeReset}
            onSubmit={async (form) => {
              const password = String(form.get('password') ?? '')
              const problem = await resetPassword(resetting.id, password)
              setResetError(problem)
              if (!problem) setResetDone(password)
            }}
          >
            <label className="flex flex-col gap-2 text-[13px] font-semibold text-[#334155]">
              New temporary password
              <input name="password" required minLength={4} defaultValue={suggestPassword()} autoComplete="off" className={wideLightInput} />
            </label>
          </SmallModal>
        ))}
    </div>
  )
}
