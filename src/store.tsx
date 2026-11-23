import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppData, NewAccount, NewCountry, NewGroup, NewHostel, Role, Rules, SessionUser } from '../shared/types.ts'
import { ApiError, api, getToken, setToken } from './api.ts'

// App-wide state: the signed-in user and the data loaded from the backend.
// Every action calls the API, then reloads the data. Actions return an error message, or '' if it worked.

const EMPTY_DATA: AppData = {
  hostels: [],
  countries: [],
  accounts: [],
  audits: [],
  contacts: [],
  rules: { capacity: 5, specialNeeds: true },
}

type Status = 'loading' | 'ready' | 'offline'

interface AppContextValue {
  data: AppData
  session: SessionUser | null
  status: Status
  start: () => Promise<void>
  login: (role: Role, username: string, password: string) => Promise<string>
  logout: () => Promise<void>
  addCountry: (form: NewCountry) => Promise<{ id?: number; error?: string }>
  addGroup: (id: number, group: NewGroup) => Promise<{ id?: number; error?: string }>
  setGroupHall: (id: number, groupId: number, hostelId: number | null) => Promise<string>
  changePeopleCount: (id: number, groupId: number, amount: number) => Promise<string>
  removeGroup: (id: number, groupId: number) => Promise<string>
  completeAllocation: (id: number) => Promise<string>
  notePrinted: (id: number) => Promise<string>
  deleteCountry: (id: number) => Promise<string>
  addHostel: (form: NewHostel) => Promise<string>
  editHostel: (id: number, form: NewHostel) => Promise<string>
  blockHostel: (id: number, reason: string) => Promise<string>
  unblockHostel: (id: number) => Promise<string>
  deleteHostel: (id: number) => Promise<string>
  addAccount: (form: NewAccount) => Promise<string>
  editAccount: (id: number, changes: Pick<NewAccount, 'name' | 'phone' | 'desk'>) => Promise<string>
  toggleAccount: (id: number) => Promise<string>
  resetPassword: (id: number, password: string) => Promise<string>
  deleteAccount: (id: number) => Promise<string>
  saveRules: (rules: Rules) => Promise<string>
}

const AppContext = createContext<AppContextValue | null>(null)

const messageOf = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA)
  const [session, setSession] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  const refresh = useCallback(async () => {
    setData(await api<AppData>('/data'))
  }, [])

  // When the page opens: if you signed in before, check that sign-in with the server
  const start = useCallback(async () => {
    setStatus('loading')
    if (!getToken()) {
      setStatus('ready')
      return
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const { user } = await api<{ user: SessionUser }>('/auth/me')
        setSession(user)
        await refresh()
        setStatus('ready')
        return
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setToken(null)
          setSession(null)
          setStatus('ready')
          return
        }
        await wait(700) // the backend may still be starting up
      }
    }
    setStatus('offline')
  }, [refresh])

  useEffect(() => {
    void start()
  }, [start])

  // Reload when you come back to the tab, in case another desk made changes
  useEffect(() => {
    if (!session) return
    const onFocus = () => void refresh().catch(() => undefined)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [session, refresh])

  function signOutHere() {
    setToken(null)
    setSession(null)
    setData(EMPTY_DATA)
  }

  async function run(request: () => Promise<unknown>) {
    try {
      await request()
      await refresh()
      return ''
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) signOutHere()
      return messageOf(error)
    }
  }

  async function login(role: Role, username: string, password: string) {
    try {
      const result = await api<{ token: string; user: SessionUser }>('/auth/login', 'POST', { role, username, password })
      setToken(result.token)
      setSession(result.user)
      await refresh()
      return ''
    } catch (error) {
      return messageOf(error)
    }
  }

  async function logout() {
    await api('/auth/logout', 'POST').catch(() => undefined)
    signOutHere()
  }

  // Like run(), for requests that create something and return its id
  async function create(path: string, body: unknown) {
    try {
      const { id } = await api<{ id: number }>(path, 'POST', body)
      await refresh()
      return { id }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) signOutHere()
      return { error: messageOf(error) }
    }
  }

  const value: AppContextValue = {
    data,
    session,
    status,
    start,
    login,
    logout,
    addCountry: (form) => create('/countries', form),
    addGroup: (id, group) => create(`/countries/${id}/groups`, group),
    setGroupHall: (id, groupId, hostelId) => run(() => api(`/countries/${id}/groups/${groupId}`, 'PATCH', { hostelId })),
    changePeopleCount: (id, groupId, amount) => run(() => api(`/countries/${id}/groups/${groupId}/people`, 'POST', { amount })),
    removeGroup: (id, groupId) => run(() => api(`/countries/${id}/groups/${groupId}`, 'DELETE')),
    completeAllocation: (id) => run(() => api(`/countries/${id}/allocate`, 'POST')),
    notePrinted: (id) => run(() => api(`/countries/${id}/printed`, 'POST')),
    deleteCountry: (id) => run(() => api(`/countries/${id}`, 'DELETE')),
    addHostel: (form) => run(() => api('/hostels', 'POST', form)),
    editHostel: (id, form) => run(() => api(`/hostels/${id}`, 'PUT', form)),
    blockHostel: (id, reason) => run(() => api(`/hostels/${id}/block`, 'PATCH', { reason })),
    unblockHostel: (id) => run(() => api(`/hostels/${id}/unblock`, 'PATCH')),
    deleteHostel: (id) => run(() => api(`/hostels/${id}`, 'DELETE')),
    addAccount: (form) => run(() => api('/volunteers', 'POST', form)),
    editAccount: (id, changes) => run(() => api(`/volunteers/${id}`, 'PATCH', changes)),
    toggleAccount: (id) => run(() => api(`/volunteers/${id}/toggle`, 'PATCH')),
    resetPassword: (id, password) => run(() => api(`/volunteers/${id}/password`, 'POST', { password })),
    deleteAccount: (id) => run(() => api(`/volunteers/${id}`, 'DELETE')),
    saveRules: (rules) => run(() => api('/rules', 'PUT', rules)),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}
