import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { Role } from '../../shared/types.ts'
import StatusScreen from '../components/StatusScreen.tsx'
import { useApp } from '../store.tsx'
import { cx, errorText } from '../ui.ts'

const input =
  'w-full rounded-lg border border-figma-grey bg-white px-4 py-3 outline-none focus:border-[#ef2427] focus:ring-[3px] focus:ring-[#ef2427]/15'

// Same screen for both portals: role is "volunteer" or "admin"
export default function Login({ role }: { role: Role }) {
  const { login, session, status } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isAdmin = role === 'admin'

  if (status === 'loading') return <StatusScreen />
  if (session?.role === role) return <Navigate to={`/${role}/dashboard`} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    const problem = await login(role, String(form.get('username')), String(form.get('password')))
    setBusy(false)
    if (problem) setError(problem)
    else navigate(`/${role}/dashboard`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[22px] px-5 py-10">
      <div className="flex items-center justify-center gap-[26px] max-lg:flex-col">
        <img src="/assets/crest.png" alt="Shiloh crest" className="h-[157px] w-[147px] object-contain" />
        <h1 className="text-center font-inter text-[40px] font-semibold leading-[1.2] max-sm:text-[30px]">
          Shiloh Hostel Allocation
          <span className="block">{isAdmin ? 'Admin' : 'Volunteer'} login</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-[649px] flex-col gap-5 rounded-lg bg-login p-6 font-inter">
        <label className="flex flex-col gap-2 text-[#1e1e1e]">
          Username
          <input name="username" required autoComplete="username" placeholder={isAdmin ? 'e.g Admin 1' : 'e.g Volunteer 1'} className={input} />
        </label>
        <label className="flex flex-col gap-2 text-[#1e1e1e]">
          Password
          <input name="password" type="password" required autoComplete="current-password" placeholder="*********" className={input} />
        </label>

        {error && <p className={cx(errorText, 'font-inter')}>{error}</p>}

        <button type="submit" disabled={busy} className="rounded-lg bg-[#2c2c2c] p-3 text-[#f5f5f5] hover:enabled:bg-[#181818]">
          Sign In
        </button>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-[#1e1e1e] underline"
            onClick={() =>
              setError(
                isAdmin
                  ? 'Ask another admin to reset it (Volunteers → Reset Password). The first admin login is admin / admin123.'
                  : 'Please ask an admin to reset your password.',
              )
            }
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => navigate(isAdmin ? '/volunteer/login' : '/admin/login')}
            className="rounded-md bg-[rgb(255_0_0/0.71)] px-3.5 py-1 text-base font-bold text-white shadow-[0_3px_5px_rgb(0_0_0/0.2)] hover:bg-[rgb(255_0_0/0.85)]"
          >
            {isAdmin ? 'A Volunteer?' : 'An Admin?'}
          </button>
        </div>
      </form>
    </main>
  )
}
