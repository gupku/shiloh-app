import { Router } from 'express'
import { parseRoom } from '../../shared/allocation.ts'
import type { Gender, NewHostel } from '../../shared/types.ts'
import { currentUser } from '../auth.ts'
import { loadAppData } from '../data.ts'
import { db, logAction } from '../db.ts'
import { HttpError, gender, idParam, optionalText, text, wholeNumber } from '../validate.ts'

// Admin: hostel setup
export const hostelsRouter = Router()

function findHostel(id: unknown) {
  const hostel = db
    .prepare<[number], { id: number; name: string; gender: Gender }>('SELECT id, name, gender FROM hostels WHERE id = ?')
    .get(idParam(id))
  if (!hostel) throw new HttpError(404, 'Hostel not found.')
  return hostel
}

function readHostel(body: Record<string, unknown> = {}): NewHostel {
  return {
    name: text(body.name, 'Hostel name', 60),
    gender: gender(body.gender),
    wings: wholeNumber(body.wings, 'Number of wings', 1, 26),
    floors: wholeNumber(body.floors, 'Floors per wing', 1, 20),
    roomsPerFloor: wholeNumber(body.roomsPerFloor, 'Rooms per floor', 1, 99),
    capacityPerRoom: wholeNumber(body.capacityPerRoom, 'Capacity per room', 1, 20),
  }
}

function checkNameIsFree(name: string, exceptId = 0) {
  if (db.prepare('SELECT 1 FROM hostels WHERE name = ? COLLATE NOCASE AND id != ?').get(name, exceptId)) {
    throw new HttpError(400, 'A hostel with this name already exists.')
  }
}

const describe = (h: NewHostel) => `${h.name} (${h.gender}): ${h.wings} wings × ${h.floors} floors × ${h.roomsPerFloor} rooms, ${h.capacityPerRoom} per room`

// POST /api/hostels
hostelsRouter.post('/', (req, res) => {
  const hostel = readHostel(req.body)
  checkNameIsFree(hostel.name)
  db.transaction(() => {
    db.prepare('INSERT INTO hostels (name, gender, wings, floors, rooms_per_floor, capacity_per_room) VALUES (?, ?, ?, ?, ?, ?)').run(
      hostel.name,
      hostel.gender,
      hostel.wings,
      hostel.floors,
      hostel.roomsPerFloor,
      hostel.capacityPerRoom,
    )
    logAction(currentUser(res), 'Added Hostel', describe(hostel))
  })()
  res.status(201).json({ ok: true })
})

// PUT /api/hostels/:id  — "Edit Configuration". Rooms already given out must still fit.
hostelsRouter.put('/:id', (req, res) => {
  const current = findHostel(req.params.id)
  const hostel = readHostel(req.body)
  checkNameIsFree(hostel.name, current.id)

  const data = loadAppData(false)
  const allocated = data.countries.flatMap((c) => c.groups.filter((g) => g.allocatedHostelId === current.id).map((g) => ({ ...g, country: c.name })))
  if (allocated.length) {
    if (hostel.gender !== current.gender) throw new HttpError(400, `${current.name} has allocated rooms, so its gender can't change.`)
    for (const group of allocated) {
      for (const room of group.rooms) {
        const { wing, floor, number } = parseRoom(room)
        if (wing.charCodeAt(0) - 65 >= hostel.wings || floor > hostel.floors || number > hostel.roomsPerFloor) {
          throw new HttpError(400, `Room ${room} is allocated to ${group.country}, so the hall can't be made that small.`)
        }
      }
      const perRoom = Math.max(1, Math.min(data.rules.capacity, hostel.capacityPerRoom))
      if (Math.ceil(group.count / perRoom) > group.rooms.length) {
        throw new HttpError(400, `${group.country}'s rooms would hold too many people at ${hostel.capacityPerRoom} per room.`)
      }
    }
  }

  db.transaction(() => {
    db.prepare('UPDATE hostels SET name = ?, gender = ?, wings = ?, floors = ?, rooms_per_floor = ?, capacity_per_room = ? WHERE id = ?').run(
      hostel.name,
      hostel.gender,
      hostel.wings,
      hostel.floors,
      hostel.roomsPerFloor,
      hostel.capacityPerRoom,
      current.id,
    )
    // groups of the other gender can no longer use this hall
    db.prepare('UPDATE delegate_groups SET hostel_id = NULL WHERE hostel_id = ? AND gender != ?').run(current.id, hostel.gender)
    logAction(currentUser(res), 'Edited Hostel', describe(hostel))
  })()
  res.json({ ok: true })
})

// PATCH /api/hostels/:id/block  { reason }  — hidden from volunteers until unblocked
hostelsRouter.patch('/:id/block', (req, res) => {
  const hostel = findHostel(req.params.id)
  const reason = optionalText(req.body?.reason, 120)
  db.transaction(() => {
    db.prepare('UPDATE hostels SET blocked = 1, block_reason = ? WHERE id = ?').run(reason, hostel.id)
    logAction(currentUser(res), 'Blocked Hall', reason ? `${hostel.name} — ${reason}` : hostel.name)
  })()
  res.json({ ok: true })
})

// PATCH /api/hostels/:id/unblock
hostelsRouter.patch('/:id/unblock', (req, res) => {
  const hostel = findHostel(req.params.id)
  db.transaction(() => {
    db.prepare("UPDATE hostels SET blocked = 0, block_reason = '' WHERE id = ?").run(hostel.id)
    logAction(currentUser(res), 'Unblocked Hall', hostel.name)
  })()
  res.json({ ok: true })
})

// DELETE /api/hostels/:id  — only if no rooms are allocated in it
hostelsRouter.delete('/:id', (req, res) => {
  const hostel = findHostel(req.params.id)
  if (db.prepare('SELECT 1 FROM room_allocations WHERE hostel_id = ?').get(hostel.id)) {
    throw new HttpError(400, `${hostel.name} has allocated rooms, so it can't be deleted. Block it instead.`)
  }
  db.transaction(() => {
    db.prepare('DELETE FROM hostels WHERE id = ?').run(hostel.id) // groups that picked it go back to "no hall"
    logAction(currentUser(res), 'Deleted Hostel', hostel.name)
  })()
  res.json({ ok: true })
})
