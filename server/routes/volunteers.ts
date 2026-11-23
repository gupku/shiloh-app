import { Router } from 'express'
import type { AccountStatus, Role } from '../../shared/types.ts'
import { currentUser, tokenFrom } from '../auth.ts'
import { db, logAction } from '../db.ts'
import { hashPassword } from '../passwords.ts'
import { HttpError, idParam, optionalText, text } from '../validate.ts'

// Admin: volunteer (and admin) accounts
export const volunteersRouter = Router()

interface AccountRow {
  id: number
  name: string
  role: Role
  status: AccountStatus
}

function findAccount(id: unknown) {
  const account = db.prepare<[number], AccountRow>('SELECT id, name, role, status FROM users WHERE id = ?').get(idParam(id))
  if (!account) throw new HttpError(404, 'Account not found.')
  return account
}

function readPassword(value: unknown) {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 4) throw new HttpError(400, 'The password must be at least 4 characters.')
  return password
}

// You can't lock yourself out, and there must always be an active admin
function checkCanRemove(account: AccountRow, myId: number, verb: string) {
  if (account.id === myId) throw new HttpError(400, `You can't ${verb} your own account.`)
  if (account.role === 'admin' && account.status === 'Active') {
    const others = db.prepare<[number], { n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'Active' AND id != ?").get(account.id)
    if (!others?.n) throw new HttpError(400, 'Keep at least one active admin account.')
  }
}

// POST /api/volunteers  { name, username, phone, desk, password, role }
volunteersRouter.post('/', (req, res) => {
  const body = req.body ?? {}
  const name = text(body.name, 'Full name', 60)
  const username = text(body.username, 'Username', 30)
  const phone = optionalText(body.phone, 30)
  const desk = optionalText(body.desk, 60) || 'Unassigned'
  const role: Role = body.role === 'admin' ? 'admin' : 'volunteer'
  const password = readPassword(body.password)

  if (/\s/.test(username)) throw new HttpError(400, 'Usernames cannot contain spaces.')
  if (db.prepare('SELECT 1 FROM users WHERE username = ? COLLATE NOCASE').get(username)) {
    throw new HttpError(400, 'That username is already taken.')
  }

  db.transaction(() => {
    db.prepare('INSERT INTO users (name, username, password_hash, role, phone, desk) VALUES (?, ?, ?, ?, ?, ?)').run(
      name,
      username,
      hashPassword(password),
      role,
      phone,
      desk,
    )
    logAction(currentUser(res), 'Created Account', `${name} (${username}) — ${role === 'admin' ? 'Admin' : 'Volunteer Staff'}, ${desk}`)
  })()

  res.status(201).json({ ok: true })
})

// PATCH /api/volunteers/:id  { name, phone, desk }  — edit details / move to another desk
volunteersRouter.patch('/:id', (req, res) => {
  const account = findAccount(req.params.id)
  const body = req.body ?? {}
  const name = text(body.name, 'Full name', 60)
  const phone = optionalText(body.phone, 30)
  const desk = optionalText(body.desk, 60) || 'Unassigned'
  db.transaction(() => {
    db.prepare('UPDATE users SET name = ?, phone = ?, desk = ? WHERE id = ?').run(name, phone, desk, account.id)
    logAction(currentUser(res), 'Edited Account', `${name} — ${desk}${phone ? `, ${phone}` : ''}`)
  })()
  res.json({ ok: true })
})

// PATCH /api/volunteers/:id/toggle  — suspend / activate (suspending signs them out)
volunteersRouter.patch('/:id/toggle', (req, res) => {
  const me = currentUser(res)
  const account = findAccount(req.params.id)
  const status: AccountStatus = account.status === 'Active' ? 'Deactivated' : 'Active'
  if (status === 'Deactivated') checkCanRemove(account, me.id, 'suspend')
  db.transaction(() => {
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, account.id)
    if (status === 'Deactivated') db.prepare('DELETE FROM sessions WHERE user_id = ?').run(account.id)
    logAction(me, status === 'Active' ? 'Activated Account' : 'Suspended Account', account.name)
  })()
  res.json({ ok: true })
})

// POST /api/volunteers/:id/password  { password }  — "Reset Password" (signs them out everywhere else)
volunteersRouter.post('/:id/password', (req, res) => {
  const account = findAccount(req.params.id)
  const password = readPassword(req.body?.password)
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), account.id)
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(account.id, tokenFrom(req))
    logAction(currentUser(res), 'Reset Password', account.name)
  })()
  res.json({ ok: true })
})

// DELETE /api/volunteers/:id
volunteersRouter.delete('/:id', (req, res) => {
  const me = currentUser(res)
  const account = findAccount(req.params.id)
  checkCanRemove(account, me.id, 'delete')
  db.transaction(() => {
    db.prepare('DELETE FROM users WHERE id = ?').run(account.id)
    logAction(me, 'Deleted Account', account.name)
  })()
  res.json({ ok: true })
})
