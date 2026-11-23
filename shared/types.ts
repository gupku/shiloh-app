// Types shared by the frontend (src/) and the backend (server/)

export type Gender = 'Male' | 'Female'
export type Role = 'admin' | 'volunteer'
export type AccountStatus = 'Active' | 'Deactivated' // "Deactivated" is shown as "Suspended"

export interface Hostel {
  id: number
  name: string
  gender: Gender
  wings: number
  floors: number
  roomsPerFloor: number
  capacityPerRoom: number
  blocked: boolean
  blockReason: string
}

// One coordinator's group inside a country (male or female). Each group gets its own rooms.
export interface DelegateGroup {
  id: number
  main: boolean // the group created with the country (can't be removed)
  gender: Gender
  region: string // state / region
  province: string
  coordinator: string
  count: number
  hostelId: number | null // hall picked for this group
  specialNeeds: boolean
  rooms: string[] // e.g. ["A201", "A202"]
  allocatedHostelId: number | null // hall the rooms are in
}

export interface Country {
  id: number
  code: string
  name: string
  state: string
  coordinator: string
  province: string
  assigned: boolean
  createdAt: string
  groups: DelegateGroup[]
}

// Admin and volunteer logins (admins only)
export interface Account {
  id: number
  name: string
  username: string
  phone: string
  role: Role
  desk: string
  status: AccountStatus
  lastActive: string | null
}

// Staff phone numbers shown in "Contact help"
export interface Contact {
  name: string
  phone: string
  role: Role
  desk: string
}

export interface AuditLog {
  id: number
  time: string
  actor: string
  role: string // 'admin' | 'volunteer'
  action: string
  details: string
}

export interface Rules {
  capacity: number
  specialNeeds: boolean
}

// Everything the frontend loads from GET /api/data
export interface AppData {
  hostels: Hostel[]
  countries: Country[]
  accounts: Account[] // admins only
  audits: AuditLog[] // admins only
  contacts: Contact[]
  rules: Rules
}

export interface SessionUser {
  id: number
  name: string
  username: string
  role: Role
}

// Request bodies
export interface NewCountry {
  code: string
  name: string
  state: string
  coordinator: string
  province: string
  count: number
  gender: Gender
  hostelId: number | null
}

export interface NewGroup {
  gender: Gender
  region: string
  province: string
  coordinator: string
  count: number
  hostelId: number | null
  specialNeeds: boolean
}

export type NewHostel = Omit<Hostel, 'id' | 'blocked' | 'blockReason'>

export interface NewAccount {
  name: string
  username: string
  phone: string
  desk: string
  password: string
  role: Role
}
