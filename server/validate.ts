import type { Gender } from '../shared/types.ts'

// Throw one of these from a route to send an error message back to the app
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function text(value: unknown, label: string, maxLength = 100) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${label} is required.`)
  if (value.trim().length > maxLength) throw new HttpError(400, `${label} is too long (max ${maxLength} characters).`)
  return value.trim()
}

export function optionalText(value: unknown, maxLength = 100) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string') throw new HttpError(400, 'Invalid text.')
  return value.trim().slice(0, maxLength)
}

export function wholeNumber(value: unknown, label: string, min: number, max: number) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new HttpError(400, `${label} must be a whole number from ${min} to ${max}.`)
  }
  return number
}

export function gender(value: unknown): Gender {
  if (value !== 'Male' && value !== 'Female') throw new HttpError(400, 'Gender must be Male or Female.')
  return value
}

// A hall id from the app, or null for "no hall"
export function optionalId(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return wholeNumber(value, 'Id', 1, Number.MAX_SAFE_INTEGER)
}

// An id from the URL, e.g. /api/countries/12
export function idParam(value: unknown) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Not found.')
  return id
}
