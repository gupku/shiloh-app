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

async function findAccount(id: unknown) {
  const account = await db.get<AccountRow>('SELECT id, name, role, status FROM users WHERE id = ?', idParam(id))
  if (!account) throw new HttpError(404, 'Account not found.')
  return account
}

function readPassword(value: unknown) {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 4) throw new HttpError(400, 'The password must be at least 4 characters.')
  return password
}

// You can't lock yourself out, and there must always be an active admin
async function checkCanRemove(account: AccountRow, myId: number, verb: string) {
  if (account.id === myId) throw new HttpError(400, `You can't ${verb} your own account.`)
  if (account.role === 'admin' && account.status === 'Active') {
    const others = await db.get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'Active' AND id != ?", account.id)
    if (!others?.n) throw new HttpError(400, 'Keep at least one active admin account.')
  }
}

// POST /api/volunteers  { name, username, phone, desk, password, role }
volunteersRouter.post('/', async (req, res) => {
  const body = req.body ?? {}
  const name = text(body.name, 'Full name', 60)
  const username = text(body.username, 'Username', 30)
  const phone = optionalText(body.phone, 30)
  const desk = optionalText(body.desk, 60) || 'Unassigned'
  const role: Role = body.role === 'admin' ? 'admin' : 'volunteer'
  const password = readPassword(body.password)

  if (/\s/.test(username)) throw new HttpError(400, 'Usernames cannot contain spaces.')
  if (await db.get('SELECT 1 FROM users WHERE username = ? COLLATE NOCASE', username)) {
    throw new HttpError(400, 'That username is already taken.')
  }

  await db.transaction(async (tx) => {
    await tx.run(
      'INSERT INTO users (name, username, password_hash, role, phone, desk) VALUES (?, ?, ?, ?, ?, ?)',
      name,
      username,
      hashPassword(password),
      role,
      phone,
      desk,
    )
    await logAction(tx, currentUser(res), 'Created Account', `${name} (${username}) — ${role === 'admin' ? 'Admin' : 'Volunteer Staff'}, ${desk}`)
  })

  res.status(201).json({ ok: true })
})

// PATCH /api/volunteers/:id  { name, phone, desk }  — edit details / move to another desk
volunteersRouter.patch('/:id', async (req, res) => {
  const account = await findAccount(req.params.id)
  const body = req.body ?? {}
  const name = text(body.name, 'Full name', 60)
  const phone = optionalText(body.phone, 30)
  const desk = optionalText(body.desk, 60) || 'Unassigned'
  await db.transaction(async (tx) => {
    await tx.run('UPDATE users SET name = ?, phone = ?, desk = ? WHERE id = ?', name, phone, desk, account.id)
    await logAction(tx, currentUser(res), 'Edited Account', `${name} — ${desk}${phone ? `, ${phone}` : ''}`)
  })
  res.json({ ok: true })
})

// PATCH /api/volunteers/:id/toggle  — suspend / activate (suspending signs them out)
volunteersRouter.patch('/:id/toggle', async (req, res) => {
  const me = currentUser(res)
  const account = await findAccount(req.params.id)
  const status: AccountStatus = account.status === 'Active' ? 'Deactivated' : 'Active'
  if (status === 'Deactivated') await checkCanRemove(account, me.id, 'suspend')
  await db.transaction(async (tx) => {
    await tx.run('UPDATE users SET status = ? WHERE id = ?', status, account.id)
    if (status === 'Deactivated') await tx.run('DELETE FROM sessions WHERE user_id = ?', account.id)
    await logAction(tx, me, status === 'Active' ? 'Activated Account' : 'Suspended Account', account.name)
  })
  res.json({ ok: true })
})

// POST /api/volunteers/:id/password  { password }  — "Reset Password" (signs them out everywhere else)
volunteersRouter.post('/:id/password', async (req, res) => {
  const account = await findAccount(req.params.id)
  const password = readPassword(req.body?.password)
  await db.transaction(async (tx) => {
    await tx.run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(password), account.id)
    await tx.run('DELETE FROM sessions WHERE user_id = ? AND token != ?', account.id, tokenFrom(req))
    await logAction(tx, currentUser(res), 'Reset Password', account.name)
  })
  res.json({ ok: true })
})

// DELETE /api/volunteers/:id
volunteersRouter.delete('/:id', async (req, res) => {
  const me = currentUser(res)
  const account = await findAccount(req.params.id)
  await checkCanRemove(account, me.id, 'delete')
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM sessions WHERE user_id = ?', account.id)
    await tx.run('DELETE FROM users WHERE id = ?', account.id)
    await logAction(tx, me, 'Deleted Account', account.name)
  })
  res.json({ ok: true })
})
