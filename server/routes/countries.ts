import { Router } from 'express'
import { allocateCountry, describeRooms, peopleCount } from '../../shared/allocation.ts'
import type { Gender } from '../../shared/types.ts'
import { currentUser } from '../auth.ts'
import { loadAppData } from '../data.ts'
import { db, logAction } from '../db.ts'
import { HttpError, gender, idParam, optionalId, text, wholeNumber } from '../validate.ts'

// Volunteer desk: register countries, add delegate groups and allocate rooms
export const countriesRouter = Router()

interface GroupRow {
  id: number
  gender: Gender
  is_main: number
}

function findCountry(id: unknown) {
  const country = db.prepare<[number], { id: number; name: string }>('SELECT id, name FROM countries WHERE id = ?').get(idParam(id))
  if (!country) throw new HttpError(404, 'Country not found.')
  return country
}

function findGroup(countryId: number, id: unknown) {
  const group = db
    .prepare<[number, number], GroupRow>('SELECT id, gender, is_main FROM delegate_groups WHERE id = ? AND country_id = ?')
    .get(idParam(id), countryId)
  if (!group) throw new HttpError(404, 'Group not found.')
  return group
}

// A chosen hall must exist, be open and match the group's gender
function checkHall(hostelId: number | null, groupGender: Gender) {
  if (hostelId === null) return
  const hall = db
    .prepare<[number], { name: string; gender: Gender; blocked: number }>('SELECT name, gender, blocked FROM hostels WHERE id = ?')
    .get(hostelId)
  if (!hall) throw new HttpError(400, 'That hall does not exist.')
  if (hall.blocked) throw new HttpError(400, `${hall.name} is blocked.`)
  if (hall.gender !== groupGender) throw new HttpError(400, `${hall.name} is for ${hall.gender.toLowerCase()} delegates only.`)
}

// Any change to a country releases its rooms; the volunteer then completes the allocation again
function releaseRooms(countryId: number) {
  db.prepare('DELETE FROM room_allocations WHERE group_id IN (SELECT id FROM delegate_groups WHERE country_id = ?)').run(countryId)
  db.prepare('UPDATE countries SET assigned = 0 WHERE id = ?').run(countryId)
}

const insertGroup = db.prepare(
  `INSERT INTO delegate_groups (country_id, is_main, gender, region, province, coordinator, people, hostel_id, special_needs)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
)

// POST /api/countries  — the country's coordinator and people count become its first group
countriesRouter.post('/', (req, res) => {
  const body = req.body ?? {}
  const groupGender = gender(body.gender)
  const hostelId = optionalId(body.hostelId)
  const code = text(body.code, 'Country code', 2).toUpperCase()
  const name = text(body.name, 'Country', 60)
  const state = text(body.state, 'State')
  const coordinator = text(body.coordinator, 'Coordinator')
  const province = text(body.province, 'Province', 30)
  const count = wholeNumber(body.count, 'People count', 1, 100000)
  checkHall(hostelId, groupGender)

  const id = db.transaction(() => {
    const result = db
      .prepare('INSERT INTO countries (code, name, state, coordinator, province) VALUES (?, ?, ?, ?, ?)')
      .run(code, name, state, coordinator, province)
    const countryId = Number(result.lastInsertRowid)
    insertGroup.run(countryId, 1, groupGender, state, province, coordinator, count, hostelId, 0)
    logAction(currentUser(res), 'Registered Country', `${name} (${count} ${groupGender.toLowerCase()} delegates)`)
    return countryId
  })()

  res.status(201).json({ id })
})

// POST /api/countries/:id/groups  — add another coordinator's group (male or female)
countriesRouter.post('/:id/groups', (req, res) => {
  const country = findCountry(req.params.id)
  const body = req.body ?? {}
  const groupGender = gender(body.gender)
  const hostelId = optionalId(body.hostelId)
  const region = text(body.region, 'State')
  const province = text(body.province, 'Province', 30)
  const coordinator = text(body.coordinator, 'Coordinator')
  const count = wholeNumber(body.count, 'People count', 1, 100000)
  const specialNeeds = body.specialNeeds === true
  checkHall(hostelId, groupGender)

  const id = db.transaction(() => {
    const result = insertGroup.run(country.id, 0, groupGender, region, province, coordinator, count, hostelId, specialNeeds ? 1 : 0)
    releaseRooms(country.id)
    return Number(result.lastInsertRowid)
  })()

  res.status(201).json({ id })
})

// PATCH /api/countries/:id/groups/:groupId  { hostelId }  — pick the group's hall
countriesRouter.patch('/:id/groups/:groupId', (req, res) => {
  const country = findCountry(req.params.id)
  const group = findGroup(country.id, req.params.groupId)
  const hostelId = optionalId(req.body?.hostelId)
  checkHall(hostelId, group.gender)
  db.transaction(() => {
    db.prepare('UPDATE delegate_groups SET hostel_id = ? WHERE id = ?').run(hostelId, group.id)
    releaseRooms(country.id)
  })()
  res.json({ ok: true })
})

// POST /api/countries/:id/groups/:groupId/people  { amount }  — the +/- buttons
countriesRouter.post('/:id/groups/:groupId/people', (req, res) => {
  const country = findCountry(req.params.id)
  const group = findGroup(country.id, req.params.groupId)
  const amount = wholeNumber(req.body?.amount, 'Amount', -1000, 1000)
  db.transaction(() => {
    db.prepare('UPDATE delegate_groups SET people = MAX(1, people + ?) WHERE id = ?').run(amount, group.id)
    releaseRooms(country.id)
  })()
  res.json({ ok: true })
})

// DELETE /api/countries/:id/groups/:groupId  — the first group can't be removed (delete the country instead)
countriesRouter.delete('/:id/groups/:groupId', (req, res) => {
  const country = findCountry(req.params.id)
  const group = findGroup(country.id, req.params.groupId)
  if (group.is_main) throw new HttpError(400, "The country's first group can't be removed. Delete the country instead.")
  db.transaction(() => {
    db.prepare('DELETE FROM delegate_groups WHERE id = ?').run(group.id)
    releaseRooms(country.id)
  })()
  res.json({ ok: true })
})

// POST /api/countries/:id/allocate  — "Complete allocation"
// Runs in one transaction, so two desks can never be given the same room.
countriesRouter.post('/:id/allocate', (req, res) => {
  const country = findCountry(req.params.id)

  db.transaction(() => {
    const data = loadAppData(false)
    const outcome = allocateCountry(data, country.id)
    if ('error' in outcome) throw new HttpError(400, outcome.error)

    releaseRooms(country.id)
    const insert = db.prepare('INSERT INTO room_allocations (hostel_id, room, group_id) VALUES (?, ?, ?)')
    for (const group of outcome.groups) {
      for (const room of group.rooms) insert.run(group.allocatedHostelId, room, group.id)
    }
    db.prepare('UPDATE countries SET assigned = 1 WHERE id = ?').run(country.id)

    const full = data.countries.find((c) => c.id === country.id)!
    logAction(currentUser(res), 'Allocated Country', `${country.name} (${peopleCount(full)} delegates) -> ${describeRooms(outcome.groups, data.hostels)}`)
  })()

  res.json({ ok: true })
})

// POST /api/countries/:id/printed  — notes in the audit log that the slip was printed
countriesRouter.post('/:id/printed', (req, res) => {
  const country = findCountry(req.params.id)
  logAction(currentUser(res), 'Printed Slip', `Printed clearance PDF for ${country.name} delegation`)
  res.json({ ok: true })
})

// DELETE /api/countries/:id  — its groups and rooms are removed too
countriesRouter.delete('/:id', (req, res) => {
  const country = findCountry(req.params.id)
  db.transaction(() => {
    db.prepare('DELETE FROM countries WHERE id = ?').run(country.id)
    logAction(currentUser(res), 'Removed Country', country.name)
  })()
  res.json({ ok: true })
})
