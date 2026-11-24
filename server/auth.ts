import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { AccountStatus, Role, SessionUser } from '../shared/types.ts'
import { db, type Runner } from './db.ts'

// The app sends "Authorization: Bearer <token>" with every request after signing in
export const tokenFrom = (req: Request) => req.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''

// How long a login lasts before the user has to sign in again
export const SESSION_HOURS = 12
const sessionCutoff = () => new Date(Date.now() - SESSION_HOURS * 60 * 60 * 1000).toISOString()

export async function createSession(tx: Runner, userId: number) {
  await tx.run('DELETE FROM sessions WHERE created_at <= ?', sessionCutoff()) // tidy up expired logins
  const token = crypto.randomBytes(32).toString('hex')
  await tx.run('INSERT INTO sessions (token, user_id) VALUES (?, ?)', token, userId)
  return token
}

interface SessionRow {
  id: number
  name: string
  username: string
  role: Role
  status: AccountStatus
}

// Stops the request unless it comes from a signed-in, active user
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = tokenFrom(req)
  const user = token
    ? await db.get<SessionRow>(
        `SELECT u.id, u.name, u.username, u.role, u.status
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.created_at > ?`,
        token,
        sessionCutoff(),
      )
    : undefined

  if (!user || user.status !== 'Active') {
    res.status(401).json({ error: 'Please sign in again.' })
    return
  }
  // "Last active" (at most one write a minute per user)
  const now = new Date()
  await db.run(
    'UPDATE users SET last_active = ? WHERE id = ? AND (last_active IS NULL OR last_active < ?)',
    now.toISOString(),
    user.id,
    new Date(now.getTime() - 60_000).toISOString(),
  )
  const sessionUser: SessionUser = { id: user.id, name: user.name, username: user.username, role: user.role }
  res.locals.user = sessionUser
  next()
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (currentUser(res).role !== 'admin') {
    res.status(403).json({ error: 'Only admins can do this.' })
    return
  }
  next()
}

export const currentUser = (res: Response) => res.locals.user as SessionUser
