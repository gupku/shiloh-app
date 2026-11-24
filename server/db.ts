import { createClient, type Client, type InValue, type ResultSet, type Transaction } from '@libsql/client'
import fs from 'node:fs'
import path from 'node:path'
import type { SessionUser } from '../shared/types.ts'
import { hashPassword } from './passwords.ts'

/*
  Where the data lives:
  - On your laptop (npm run dev): one file, database/shiloh.db (created on first run).
  - On Vercel: the Turso database whose keys are in the project's environment variables
    (TURSO_DATABASE_URL and TURSO_AUTH_TOKEN), so every device sees the same halls, accounts and rooms.
  Set those two variables locally too if you ever want your laptop to use the live database.
*/
function connect(): Client {
  const url = process.env.TURSO_DATABASE_URL
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  if (process.env.VERCEL) throw new Error('TURSO_DATABASE_URL is not set in the Vercel project settings.')
  const folder = path.resolve(import.meta.dirname, '../database')
  fs.mkdirSync(folder, { recursive: true })
  return createClient({ url: `file:${path.join(folder, 'shiloh.db')}` })
}

let client: Client | undefined
const getClient = () => (client ??= connect())

// ---------- Small helpers so the routes read like plain SQL ----------

export interface Runner {
  get<T>(sql: string, ...args: InValue[]): Promise<T | undefined>
  all<T>(sql: string, ...args: InValue[]): Promise<T[]>
  run(sql: string, ...args: InValue[]): Promise<{ lastInsertRowid: number; changes: number }>
}

// Rows come back as plain objects: { id: 1, name: 'Paul Hall', ... }
const toObjects = <T>(result: ResultSet) =>
  result.rows.map((row) => Object.fromEntries(result.columns.map((column, i) => [column, row[i]])) as T)

function runner(target: () => Client | Transaction, beforeEach: () => Promise<void>): Runner {
  return {
    async get(sql, ...args) {
      await beforeEach()
      return toObjects<never>(await target().execute({ sql, args }))[0]
    },
    async all(sql, ...args) {
      await beforeEach()
      return toObjects(await target().execute({ sql, args }))
    },
    async run(sql, ...args) {
      await beforeEach()
      const result = await target().execute({ sql, args })
      return { lastInsertRowid: Number(result.lastInsertRowid ?? 0), changes: result.rowsAffected }
    },
  }
}

// ---------- First run: tables, default rules and the admin login ----------

let setup: Promise<void> | undefined
const ready = () =>
  (setup ??= (async () => {
    const client = getClient()
    await client.executeMultiple(fs.readFileSync(path.join(import.meta.dirname, 'schema.sql'), 'utf8'))
    await client.execute('INSERT OR IGNORE INTO rules (id, capacity, special_needs) VALUES (1, 5, 1)')
    const admin = await client.execute("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")
    if (!admin.rows.length) {
      await client.execute({
        sql: "INSERT INTO users (name, username, password_hash, role) VALUES ('Main Admin', 'admin', ?, 'admin')",
        args: [hashPassword('admin123')],
      })
      console.log('Created the default admin login: admin / admin123')
    }
  })().catch((error) => {
    setup = undefined // try again on the next request
    throw error
  }))

const noWait = async () => {}

// db.get / db.all / db.run for single statements,
// db.transaction(async (tx) => { ... }) when several changes must all happen or none do.
export const db = {
  ...runner(getClient, ready),
  async transaction<T>(work: (tx: Runner) => Promise<T>): Promise<T> {
    await ready()
    const tx = await getClient().transaction('write')
    try {
      const result = await work(runner(() => tx, noWait))
      await tx.commit()
      return result
    } catch (error) {
      await tx.rollback().catch(() => {})
      throw error
    } finally {
      tx.close()
    }
  },
}

// Adds a line to the audit log, e.g. logAction(tx, user, 'Blocked Hall', 'Esther Hall')
export async function logAction(runner: Runner, user: Pick<SessionUser, 'name' | 'role'>, action: string, details: string) {
  await runner.run('INSERT INTO audit_logs (actor, role, action, details) VALUES (?, ?, ?, ?)', user.name, user.role, action, details)
}
