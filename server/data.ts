import type { AccountStatus, AppData, DelegateGroup, Gender, Role } from '../shared/types.ts'
import { db } from './db.ts'

// Database rows (snake_case) are turned into the objects the app uses (camelCase)

interface HostelRow {
  id: number
  name: string
  gender: Gender
  wings: number
  floors: number
  rooms_per_floor: number
  capacity_per_room: number
  blocked: number
  block_reason: string
}
interface CountryRow {
  id: number
  code: string
  name: string
  state: string
  coordinator: string
  province: string
  assigned: number
  created_at: string
}
interface GroupRow {
  id: number
  country_id: number
  is_main: number
  gender: Gender
  region: string
  province: string
  coordinator: string
  people: number
  hostel_id: number | null
  special_needs: number
}
interface RoomRow {
  hostel_id: number
  room: string
  group_id: number
}
interface AccountRow {
  id: number
  name: string
  username: string
  phone: string
  role: Role
  desk: string
  status: AccountStatus
  last_active: string | null
}
interface AuditRow {
  id: number
  time: string
  actor: string
  role: string
  action: string
  details: string
}
interface RulesRow {
  capacity: number
  special_needs: number
}

export function loadAppData(includeAdminData: boolean): AppData {
  const hostels = db
    .prepare<[], HostelRow>('SELECT * FROM hostels ORDER BY id')
    .all()
    .map((h) => ({
      id: h.id,
      name: h.name,
      gender: h.gender,
      wings: h.wings,
      floors: h.floors,
      roomsPerFloor: h.rooms_per_floor,
      capacityPerRoom: h.capacity_per_room,
      blocked: h.blocked === 1,
      blockReason: h.block_reason,
    }))

  // rooms come back in the order they were given out, so ranges like A201–A205 stay together
  const roomsByGroup = new Map<number, RoomRow[]>()
  for (const row of db.prepare<[], RoomRow>('SELECT hostel_id, room, group_id FROM room_allocations ORDER BY rowid').all()) {
    roomsByGroup.set(row.group_id, [...(roomsByGroup.get(row.group_id) ?? []), row])
  }

  const groupsByCountry = new Map<number, DelegateGroup[]>()
  for (const g of db.prepare<[], GroupRow>('SELECT * FROM delegate_groups ORDER BY is_main DESC, id').all()) {
    const rooms = roomsByGroup.get(g.id) ?? []
    const group: DelegateGroup = {
      id: g.id,
      main: g.is_main === 1,
      gender: g.gender,
      region: g.region,
      province: g.province,
      coordinator: g.coordinator,
      count: g.people,
      hostelId: g.hostel_id,
      specialNeeds: g.special_needs === 1,
      rooms: rooms.map((r) => r.room),
      allocatedHostelId: rooms[0]?.hostel_id ?? null,
    }
    groupsByCountry.set(g.country_id, [...(groupsByCountry.get(g.country_id) ?? []), group])
  }

  const countries = db
    .prepare<[], CountryRow>('SELECT * FROM countries ORDER BY id')
    .all()
    .map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      state: c.state,
      coordinator: c.coordinator,
      province: c.province,
      assigned: c.assigned === 1,
      createdAt: c.created_at,
      groups: groupsByCountry.get(c.id) ?? [],
    }))

  const rules = db.prepare<[], RulesRow>('SELECT capacity, special_needs FROM rules WHERE id = 1').get()

  const accountRows = db
    .prepare<[], AccountRow>('SELECT id, name, username, phone, role, desk, status, last_active FROM users ORDER BY role, id')
    .all()

  // Phone numbers of active staff, for everyone's "Contact help" popup
  const contacts = accountRows
    .filter((a) => a.status === 'Active' && a.phone)
    .map((a) => ({ name: a.name, phone: a.phone, role: a.role, desk: a.desk }))

  const accounts = includeAdminData
    ? accountRows.map((a) => ({
        id: a.id,
        name: a.name,
        username: a.username,
        phone: a.phone,
        role: a.role,
        desk: a.desk,
        status: a.status,
        lastActive: a.last_active,
      }))
    : []

  const audits = includeAdminData
    ? db.prepare<[], AuditRow>('SELECT id, time, actor, role, action, details FROM audit_logs ORDER BY id DESC LIMIT 500').all()
    : []

  return {
    hostels,
    countries,
    accounts,
    audits,
    contacts,
    rules: { capacity: rules?.capacity ?? 5, specialNeeds: (rules?.special_needs ?? 1) === 1 },
  }
}
