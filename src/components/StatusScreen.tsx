import { useApp } from '../store.tsx'
import { cx, redButton } from '../ui.ts'

// Shown while the app checks your sign-in, or when the backend can't be reached
export default function StatusScreen() {
  const { status, start } = useApp()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <img src="/assets/crest.png" alt="Shiloh crest" className="h-[105px] w-[98px] object-contain" />
      {status === 'offline' ? (
        <>
          <p className="max-w-md text-xl font-bold">Can&apos;t reach the server.</p>
          <p className="max-w-md text-slate-600">
            Make sure <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code> is running in the VS Code terminal, then try
            again.
          </p>
          <button onClick={() => void start()} className={cx(redButton, 'px-6 py-2 text-lg')}>
            Try again
          </button>
        </>
      ) : (
        <p className="text-lg text-slate-600">Loading…</p>
      )}
    </main>
  )
}
