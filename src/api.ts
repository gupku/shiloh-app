// Small helper for talking to the Express backend (all requests go to /api/...)

const TOKEN_KEY = 'shiloh-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// ---------- Sign out 5 minutes after the app was closed ----------
// While any tab of the app is open it notes the time every 15 seconds (and when the tab is hidden or closed).
// When the app opens again more than 5 minutes after that, the old login is dropped and you must sign in again.
const LAST_SEEN_KEY = 'shiloh-last-seen'
export const CLOSED_LOGOUT_MINUTES = 5

const markSeen = () => localStorage.setItem(LAST_SEEN_KEY, String(Date.now()))

function dropLoginIfClosedTooLong() {
  const token = getToken()
  if (!token) return
  const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY))
  if (lastSeen && Date.now() - lastSeen <= CLOSED_LOGOUT_MINUTES * 60_000) return
  setToken(null)
  // also end the session on the server (best effort)
  void fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {})
}

dropLoginIfClosedTooLong()
markSeen()
setInterval(markSeen, 15_000)
window.addEventListener('pagehide', markSeen)
document.addEventListener('visibilitychange', markSeen)

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const OFFLINE_MESSAGE = "Can't reach the server. Make sure `npm run dev` is running."

export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = getToken()
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, OFFLINE_MESSAGE)
  }

  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof json.error === 'string' ? json.error : response.status >= 500 ? OFFLINE_MESSAGE : 'Request failed.'
    throw new ApiError(response.status, message)
  }
  return json as T
}
