import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { currentUser, requireAdmin, requireUser } from './auth.ts'
import { loadAppData } from './data.ts'
import { authRouter } from './routes/auth.ts'
import { countriesRouter } from './routes/countries.ts'
import { hostelsRouter } from './routes/hostels.ts'
import { rulesRouter } from './routes/rules.ts'
import { volunteersRouter } from './routes/volunteers.ts'
import { HttpError } from './validate.ts'

const app = express()
app.use(express.json())

// ---------- API ----------
app.use('/api/auth', authRouter)

// Everything the signed-in user's screens need (admins also get volunteers + audit log)
app.get('/api/data', requireUser, (_req, res) => {
  res.json(loadAppData(currentUser(res).role === 'admin'))
})

app.use('/api/countries', requireUser, countriesRouter)
app.use('/api/hostels', requireUser, requireAdmin, hostelsRouter)
app.use('/api/volunteers', requireUser, requireAdmin, volunteersRouter)
app.use('/api/rules', requireUser, requireAdmin, rulesRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

// ---------- Built frontend (after "npm run build", "npm start" serves the whole app) ----------
const dist = path.resolve(import.meta.dirname, '../dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method === 'GET') res.sendFile(path.join(dist, 'index.html'))
    else next()
  })
}

// ---------- Errors ----------
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message })
    return
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'The request was not valid JSON.' })
    return
  }
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

export default app
