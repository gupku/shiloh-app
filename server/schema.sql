-- Shiloh Hostel Allocation database (SQLite)
-- Tables are created automatically the first time the server starts.

-- Admin and volunteer logins (passwords are stored as salted hashes, never as plain text)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('admin', 'volunteer')),
  phone         TEXT    NOT NULL DEFAULT '',
  desk          TEXT    NOT NULL DEFAULT 'Unassigned',
  status        TEXT    NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Deactivated')),
  last_active   TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Signed-in sessions (one row per login)
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Halls set up by the admin
CREATE TABLE IF NOT EXISTS hostels (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  gender            TEXT    NOT NULL CHECK (gender IN ('Male', 'Female')),
  wings             INTEGER NOT NULL CHECK (wings BETWEEN 1 AND 26),
  floors            INTEGER NOT NULL CHECK (floors BETWEEN 1 AND 20),
  rooms_per_floor   INTEGER NOT NULL CHECK (rooms_per_floor BETWEEN 1 AND 99),
  capacity_per_room INTEGER NOT NULL CHECK (capacity_per_room BETWEEN 1 AND 20),
  blocked           INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0, 1)),
  block_reason      TEXT    NOT NULL DEFAULT ''
);

-- Countries registered by volunteers
CREATE TABLE IF NOT EXISTS countries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  state       TEXT    NOT NULL,
  coordinator TEXT    NOT NULL,
  province    TEXT    NOT NULL,
  assigned    INTEGER NOT NULL DEFAULT 0 CHECK (assigned IN (0, 1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Delegate groups: each coordinator's male or female group inside a country
-- (the first one is created with the country)
CREATE TABLE IF NOT EXISTS delegate_groups (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id    INTEGER NOT NULL REFERENCES countries (id) ON DELETE CASCADE,
  is_main       INTEGER NOT NULL DEFAULT 0 CHECK (is_main IN (0, 1)),
  gender        TEXT    NOT NULL CHECK (gender IN ('Male', 'Female')),
  region        TEXT    NOT NULL,
  province      TEXT    NOT NULL DEFAULT '',
  coordinator   TEXT    NOT NULL,
  people        INTEGER NOT NULL CHECK (people >= 1),
  hostel_id     INTEGER REFERENCES hostels (id) ON DELETE SET NULL,
  special_needs INTEGER NOT NULL DEFAULT 0 CHECK (special_needs IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_groups_country ON delegate_groups (country_id);

-- Which group is in which room. The primary key makes it impossible to give one room to two groups.
CREATE TABLE IF NOT EXISTS room_allocations (
  hostel_id INTEGER NOT NULL REFERENCES hostels (id) ON DELETE RESTRICT,
  room      TEXT    NOT NULL, -- e.g. A201 = Wing A, floor 2, room 01
  group_id  INTEGER NOT NULL REFERENCES delegate_groups (id) ON DELETE CASCADE,
  PRIMARY KEY (hostel_id, room)
);
CREATE INDEX IF NOT EXISTS idx_rooms_group ON room_allocations (group_id);

-- Allocation rules set by the admin (always a single row)
CREATE TABLE IF NOT EXISTS rules (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  capacity      INTEGER NOT NULL DEFAULT 5 CHECK (capacity BETWEEN 1 AND 20),
  special_needs INTEGER NOT NULL DEFAULT 1 CHECK (special_needs IN (0, 1))
);

-- Activity log shown on the admin's Audit page
CREATE TABLE IF NOT EXISTS audit_logs (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  time    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor   TEXT    NOT NULL,
  role    TEXT    NOT NULL DEFAULT '',
  action  TEXT    NOT NULL,
  details TEXT    NOT NULL
);
