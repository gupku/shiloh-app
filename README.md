# Shiloh Hostel Allocation

React + TypeScript + Tailwind CSS frontend, Express (TypeScript) backend and a SQLite database.
Built from the "Shiloh App" Figma design.

## Run it (VS Code)

1. Install **Node.js 22 LTS** (or 20+) from https://nodejs.org
2. Open this folder in VS Code, then open a terminal (**Terminal → New Terminal**) and run:

   ```bash
   npm install
   npm run dev
   ```

3. The app opens at **http://localhost:5173** (the API runs on http://localhost:3001).

`npm run dev` starts both the backend and the frontend; press `Ctrl + C` to stop them.

## Logins

| Portal    | Where                              | Login                                                    |
| --------- | ---------------------------------- | -------------------------------------------------------- |
| Admin     | http://localhost:5173/admin/login  | `admin` / `admin123` (created on first run)              |
| Volunteer | http://localhost:5173/volunteer/login | Create one first: Admin → Volunteers → Create Volunteer Account |

## How it works

- **Admin**: add halls (Hostel Setup), block / unblock them with a reason, create volunteer or admin accounts
  (click a name to edit phone / desk, reset passwords), set the room capacity and special-needs rule (and try them
  in the simulator), and download the master sheet (CSV for Excel), hall door lists and the coordinator directory
  (print or save as PDF).
- **Volunteer**: add a country, then use the **Male / Female** buttons to switch between its male and female
  delegations. Each coordinator's group gets its own hall and rooms. **Complete allocation** gives out the rooms;
  the Assigned page shows the report and prints the allocation slip.
- Rooms are numbered like `A201` = Wing A, floor 2, room 01. Groups never share a room, and any change to a
  country frees its rooms until you complete the allocation again.

## Database

- On your laptop everything is saved in `database/shiloh.db` (created automatically on first run).
  The live site uses Turso instead (see Deploying).
- To look inside it, install the VS Code extension **"SQLite Viewer"** and click the file.
- To start again with an empty database, stop the app and delete the `database` folder.
- Tables are defined in `server/schema.sql`.

## Project layout

```
server/   Express API (routes/, database setup, sign-in)
shared/   Types and the room allocation logic used by both sides
src/      React app (pages/, components/, store.tsx = data from the API)
public/   Images and fonts
```

## Other commands

- `npm run build` then `npm start` — production build served by the backend at http://localhost:3001
- `npm run typecheck` — check the TypeScript

## Deploying (Vercel)

The repo is set up for Vercel: `vercel.json` runs `npm run vercel-build` (`scripts/vercel-build.mjs`), which
builds the React app and packages the Express API as one serverless function. Pushing to `main` redeploys.

The live site keeps its data in a **Turso** database (cloud SQLite, added through Vercel → Storage), so halls,
accounts and allocations are the same on every device. Vercel provides its keys as the environment variables
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. On your laptop, without those variables, the app keeps using
`database/shiloh.db`. Logins expire after 12 hours (`SESSION_HOURS` in `server/auth.ts`).
