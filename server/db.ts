import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import type { SessionUser } from '../shared/types.ts'
import { hashPassword } from './passwords.ts'

// The whole database is one file: database/shiloh.db (created on first run).
// On Vercel the app folder is read-only, so the database lives in /tmp there (a demo copy that resets now and then).
const folder = process.env.VERCEL ? '/tmp/shiloh' : path.resolve(import.meta.dirname, '../database')
fs.mkdirSync(folder, { recursive: true })

export const db = new Database(path.join(folder, 'shiloh.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(fs.readFileSync(path.join(import.meta.dirname, 'schema.sql'), 'utf8'))

// First run: default rules and the admin login
db.prepare('INSERT OR IGNORE INTO rules (id, capacity, special_needs) VALUES (1, 5, 1)').run()

if (!db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) {
  db.prepare("INSERT INTO users (name, username, password_hash, role) VALUES ('Main Admin', 'admin', ?, 'admin')").run(
    hashPassword('admin123'),
  )
  console.log('Created the default admin login: admin / admin123')
}

// Adds a line to the audit log, e.g. logAction(user, 'Blocked Hall', 'Esther Hall')
export function logAction(user: Pick<SessionUser, 'name' | 'role'>, action: string, details: string) {
  db.prepare('INSERT INTO audit_logs (actor, role, action, details) VALUES (?, ?, ?, ?)').run(user.name, user.role, action, details)
}
