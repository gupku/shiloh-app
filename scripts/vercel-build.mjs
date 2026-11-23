// Builds the app for Vercel using the Build Output API (https://vercel.com/docs/build-output-api):
//   .vercel/output/static              <- the React app (vite build)
//   .vercel/output/functions/api.func  <- the Express API as one serverless function
// Vercel runs this automatically (see vercel.json). Locally you still use `npm run dev`.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'esbuild'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, '.vercel/output')
const fn = path.join(out, 'functions/api.func')
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' })

fs.rmSync(out, { recursive: true, force: true })

// 1. Frontend
run('npx vite build')
fs.cpSync(path.join(root, 'dist'), path.join(out, 'static'), { recursive: true })

// 2. API: bundle server/app.ts (better-sqlite3 is native, so it is copied in instead of bundled)
fs.mkdirSync(fn, { recursive: true })
fs.writeFileSync(
  path.join(fn, 'entry.ts'),
  "import app from '../../../../server/app.ts'\nexport default (req, res) => app(req, res)\n",
)
await build({
  entryPoints: [path.join(fn, 'entry.ts')],
  outfile: path.join(fn, 'index.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['better-sqlite3'],
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
})
fs.rmSync(path.join(fn, 'entry.ts'))
fs.copyFileSync(path.join(root, 'server/schema.sql'), path.join(fn, 'schema.sql'))
// Only the parts of better-sqlite3 needed at runtime (skips the bundled SQLite source and other platforms)
const sqliteFrom = path.join(root, 'node_modules/better-sqlite3')
fs.cpSync(sqliteFrom, path.join(fn, 'node_modules/better-sqlite3'), {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(sqliteFrom, src)
    if (/^(deps|src|docs)(\/|$)/.test(rel)) return false
    if (rel.startsWith('prebuilds/') && !rel.startsWith('prebuilds/linux')) return false
    return true
  },
})
const nodeMajor = process.versions.node.split('.')[0] // must match the Node that compiled better-sqlite3
fs.writeFileSync(
  path.join(fn, '.vc-config.json'),
  JSON.stringify({ runtime: `nodejs${nodeMajor}.x`, handler: 'index.mjs', launcherType: 'Nodejs', shouldAddHelpers: false }, null, 2),
)

// 3. Routing: /api/* -> function, real files -> static, everything else -> React app
fs.writeFileSync(
  path.join(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [{ src: '^/api(?:/.*)?$', dest: '/api' }, { handle: 'filesystem' }, { src: '/.*', dest: '/index.html' }],
    },
    null,
    2,
  ),
)
console.log('Vercel build output ready in .vercel/output')
