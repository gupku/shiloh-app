import { Router } from 'express'
import type { AccountStatus, Role, SessionUser } from '../../shared/types.ts'
import { createSession, currentUser, requireUser, tokenFrom } from '../auth.ts'
import { db, logAction } from '../db.ts'
import { checkPassword } from '../passwords.ts'
import { HttpError } from '../validate.ts'

export const authRouter = Router()

interface LoginRow {
  id: number
  name: string
  username: string
  role: Role
  status: AccountStatus
  password_hash: string
}

// POST /api/auth/login  { role, username, password }  ->  { token, user }
authRouter.post('/login', (req, res) => {
  const role: Role = req.body?.role === 'admin' ? 'admin' : 'volunteer'
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (role === 'volunteer' && !db.prepare("SELECT 1 FROM users WHERE role = 'volunteer'").get()) {
    throw new HttpError(401, 'No volunteer accounts yet. An admin needs to create one first (Admin → Volunteers).')
  }

  const user = db
    .prepare<[string, Role], LoginRow>(
      'SELECT id, name, username, role, status, password_hash FROM users WHERE username = ? COLLATE NOCASE AND role = ?',
    )
    .get(username, role)

  if (!user || !checkPassword(password, user.password_hash)) throw new HttpError(401, 'Wrong username or password.')
  if (user.status !== 'Active') throw new HttpError(403, 'This account has been deactivated. Please contact an admin.')

  const token = db.transaction(() => {
    db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(new Date().toISOString(), user.id)
    logAction(user, 'Signed In', role === 'admin' ? 'Admin portal' : 'Volunteer portal')
    return createSession(user.id)
  })()

  const sessionUser: SessionUser = { id: user.id, name: user.name, username: user.username, role: user.role }
  res.json({ token, user: sessionUser })
})

// GET /api/auth/me  ->  the signed-in user (used when the page reloads)
authRouter.get('/me', requireUser, (_req, res) => {
  res.json({ user: currentUser(res) })
})

// POST /api/auth/logout
authRouter.post('/logout', requireUser, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(tokenFrom(req))
  res.json({ ok: true })
})
