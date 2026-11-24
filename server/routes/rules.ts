import { Router } from 'express'
import { currentUser } from '../auth.ts'
import { db, logAction } from '../db.ts'
import { wholeNumber } from '../validate.ts'

// Admin: allocation rules
export const rulesRouter = Router()

// PUT /api/rules  { capacity, specialNeeds }
rulesRouter.put('/', async (req, res) => {
  const capacity = wholeNumber(req.body?.capacity, 'Room capacity', 1, 20)
  const specialNeeds = req.body?.specialNeeds === true
  const before = await db.get<{ capacity: number; special_needs: number }>('SELECT capacity, special_needs FROM rules WHERE id = 1')

  const changes: string[] = []
  if (before?.capacity !== capacity) changes.push(`Changed room capacity from ${before?.capacity} to ${capacity} beds/room`)
  if ((before?.special_needs === 1) !== specialNeeds) changes.push(`Special needs priority turned ${specialNeeds ? 'on' : 'off'}`)

  await db.transaction(async (tx) => {
    await tx.run('UPDATE rules SET capacity = ?, special_needs = ? WHERE id = 1', capacity, specialNeeds ? 1 : 0)
    if (changes.length) await logAction(tx, currentUser(res), 'Updated Rules', changes.join('; '))
  })
  res.json({ ok: true })
})
