import crypto from 'node:crypto'

// Passwords are saved as "salt:hash" using scrypt (built into Node), never as plain text.

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function checkPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = crypto.scryptSync(password, salt, expected.length)
  return crypto.timingSafeEqual(actual, expected)
}
