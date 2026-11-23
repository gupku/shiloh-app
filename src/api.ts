// Small helper for talking to the Express backend (all requests go to /api/...)

const TOKEN_KEY = 'shiloh-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

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
