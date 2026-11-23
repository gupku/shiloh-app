import { Router } from 'express'
import { currentUser } from '../auth.ts'
import { db, logAction } from '../db.ts'
import { wholeNumber } from '../validate.ts'

// Admin: allocation rules
export const rulesRouter = Router()

// PUT /api/rules  { capacity, specialNeeds }
rulesRouter.put('/', (req, res) => {
  const capacity = wholeNumber(req.body?.capacity, 'Room capacity', 1, 20)
  const specialNeeds = req.body?.specialNeeds === true
  const before = db.prepare<[], { capacity: number; special_needs: number }>('SELECT capacity, special_needs FROM rules WHERE id = 1').get()

  const changes: string[] = []
  if (before?.capacity !== capacity) changes.push(`Changed room capacity from ${before?.capacity} to ${capacity} beds/room`)
  if ((before?.special_needs === 1) !== specialNeeds) changes.push(`Special needs priority turned ${specialNeeds ? 'on' : 'off'}`)

  db.transaction(() => {
    db.prepare('UPDATE rules SET capacity = ?, special_needs = ? WHERE id = 1').run(capacity, specialNeeds ? 1 : 0)
    if (changes.length) logAction(currentUser(res), 'Updated Rules', changes.join('; '))
  })()
  res.json({ ok: true })
})
