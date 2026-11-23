import type { AppData, Country, DelegateGroup, Gender, Hostel, Rules } from './types.ts'

// Room numbers look like "A101" = Wing A, floor 1, room 01.

export const wingLetter = (index: number) => String.fromCharCode(65 + index) // 0 -> "A"

const roomNumber = (wing: string, floor: number, room: number) => `${wing}${floor}${String(room).padStart(2, '0')}`

export const totalRooms = (hostel: Hostel) => hostel.wings * hostel.floors * hostel.roomsPerFloor

export const peopleCount = (country: Country) => country.groups.reduce((sum, g) => sum + g.count, 0)

// Every room in a hostel, in filling order: Wing A floor 1, floor 2 ... then Wing B ...
export function listRooms(hostel: Hostel) {
  const rooms: { id: string; floor: number }[] = []
  for (let w = 0; w < hostel.wings; w++) {
    for (let floor = 1; floor <= hostel.floors; floor++) {
      for (let room = 1; room <= hostel.roomsPerFloor; room++) {
        rooms.push({ id: roomNumber(wingLetter(w), floor, room), floor })
      }
    }
  }
  return rooms
}

// Room numbers already given out in a hostel (optionally ignoring one country)
export function usedRooms(countries: Country[], hostelId: number, ignoreCountryId?: number) {
  const used = new Set<string>()
  for (const country of countries) {
    if (country.id === ignoreCountryId) continue
    for (const group of country.groups) {
      if (group.allocatedHostelId === hostelId) group.rooms.forEach((room) => used.add(room))
    }
  }
  return used
}

export function hallUsage(countries: Country[], hostel: Hostel) {
  const total = totalRooms(hostel)
  const used = usedRooms(countries, hostel.id).size
  return { total, used, free: total - used }
}

// Free rooms per wing and floor (used by the "Available halls" popup)
export function wingAvailability(countries: Country[], hostel: Hostel) {
  const used = usedRooms(countries, hostel.id)
  return Array.from({ length: hostel.wings }, (_, w) => {
    const wing = wingLetter(w)
    const floors = Array.from({ length: hostel.floors }, (_, f) => {
      const floor = f + 1
      let free = 0
      for (let room = 1; room <= hostel.roomsPerFloor; room++) {
        if (!used.has(roomNumber(wing, floor, room))) free++
      }
      return { floor, free }
    })
    return { wing, floors, free: floors.reduce((sum, f) => sum + f.free, 0) }
  })
}

/*
  Gives every group of a country its own rooms (groups never share a room).
  - Each group goes into the hall picked for it, which must match the group's gender.
  - People per room = the smaller of the admin's room capacity rule and the hall's capacity.
  - Rooms are filled in order, so each group stays in neighbouring rooms.
  - Special needs priority ON: special-needs groups get the ground floor first,
    everyone else fills the upper floors first.
  The server runs this inside a database transaction when a volunteer clicks "Complete allocation".
*/
export function allocateCountry(
  data: Pick<AppData, 'countries' | 'hostels' | 'rules'>,
  countryId: number,
): { groups: DelegateGroup[] } | { error: string } {
  const country = data.countries.find((c) => c.id === countryId)
  if (!country) return { error: 'Country not found.' }

  const takenByHall = new Map<number, Set<string>>()
  const groups: DelegateGroup[] = []

  for (const group of country.groups) {
    const label = `${group.region} (${group.gender.toLowerCase()})`
    if (!group.hostelId) return { error: `Select a hall for ${label} first.` }
    const hostel = data.hostels.find((h) => h.id === group.hostelId)
    if (!hostel) return { error: `The hall for ${label} no longer exists. Pick another hall.` }
    if (hostel.blocked) return { error: `${hostel.name} is blocked. Pick another hall for ${label}.` }
    if (hostel.gender !== group.gender) return { error: `${hostel.name} is for ${hostel.gender.toLowerCase()} delegates only.` }

    const perRoom = Math.max(1, Math.min(data.rules.capacity, hostel.capacityPerRoom))
    const needed = Math.ceil(group.count / perRoom)

    if (!takenByHall.has(hostel.id)) takenByHall.set(hostel.id, usedRooms(data.countries, hostel.id, country.id))
    const taken = takenByHall.get(hostel.id)!

    let free = listRooms(hostel).filter((room) => !taken.has(room.id))
    if (data.rules.specialNeeds && hostel.floors > 1) {
      const ground = free.filter((room) => room.floor === 1)
      const upper = free.filter((room) => room.floor !== 1)
      free = group.specialNeeds ? [...ground, ...upper] : [...upper, ...ground]
    }

    if (free.length < needed) {
      return { error: `Not enough free rooms in ${hostel.name}: ${label} needs ${needed}, only ${free.length} left.` }
    }

    const rooms = free.slice(0, needed).map((room) => room.id)
    rooms.forEach((room) => taken.add(room))
    groups.push({ ...group, rooms, allocatedHostelId: hostel.id })
  }

  return { groups }
}

// "Test Allocation Simulator": the rooms a new group of `count` people would get in a hall right now
export function simulateAllocation(data: Pick<AppData, 'countries' | 'hostels'>, rules: Rules, hostelId: number, count: number) {
  const hostel = data.hostels.find((h) => h.id === hostelId)
  if (!hostel) return { error: 'Pick a hall.' }
  const testGroup: DelegateGroup = {
    id: -1,
    main: true,
    gender: hostel.gender,
    region: 'Test group',
    province: '',
    coordinator: '',
    count,
    hostelId,
    specialNeeds: false,
    rooms: [],
    allocatedHostelId: null,
  }
  const test: Country = { id: -1, code: '', name: 'Test', state: '', coordinator: '', province: '', assigned: false, createdAt: '', groups: [testGroup] }
  const outcome = allocateCountry({ countries: [...data.countries, test], hostels: data.hostels, rules }, test.id)
  if ('error' in outcome) return { error: outcome.error }
  const perRoom = Math.max(1, Math.min(rules.capacity, hostel.capacityPerRoom))
  return { hostel, rooms: outcome.groups[0].rooms, perRoom, leftover: count % perRoom }
}

// Male and female delegates in a country
export function genderCounts(country: Country) {
  const count = (gender: Gender) => country.groups.filter((g) => g.gender === gender).reduce((sum, g) => sum + g.count, 0)
  return { Male: count('Male'), Female: count('Female') }
}

// "A201" -> wing "A", floor 2, room 1
export function parseRoom(room: string) {
  return { wing: room[0], floor: Number(room.slice(1, -2)), number: Number(room.slice(-2)) }
}

// Wing letters used by a list of rooms, e.g. ["A", "B"]
export const wingsOf = (rooms: string[]) => [...new Set(rooms.map((room) => room[0]))]

// ["A101","A102","A103","B205"] -> "A101–A103, B205"
export function formatRooms(rooms: string[] = []) {
  const ranges: { block: string; start: string; end: string; endNumber: number }[] = []
  for (const room of rooms) {
    const block = room.slice(0, -2)
    const number = Number(room.slice(-2))
    const last = ranges[ranges.length - 1]
    if (last && last.block === block && last.endNumber + 1 === number) {
      last.end = room
      last.endNumber = number
    } else {
      ranges.push({ block, start: room, end: room, endNumber: number })
    }
  }
  return ranges.map((r) => (r.start === r.end ? r.start : `${r.start}–${r.end}`)).join(', ')
}

// "Daniel Hall A201–A205; Joseph Hall B101"
export function describeRooms(groups: DelegateGroup[], hostels: Hostel[]) {
  const byHall = new Map<number, string[]>()
  for (const group of groups) {
    if (!group.rooms.length || group.allocatedHostelId === null) continue
    byHall.set(group.allocatedHostelId, [...(byHall.get(group.allocatedHostelId) ?? []), ...group.rooms])
  }
  return [...byHall]
    .map(([hostelId, rooms]) => `${hostels.find((h) => h.id === hostelId)?.name ?? 'Hall'} ${formatRooms(rooms)}`)
    .join('; ')
}
