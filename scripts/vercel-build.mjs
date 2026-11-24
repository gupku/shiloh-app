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

// 2. API: bundle server/app.ts into one file. On Vercel the database is Turso, reached with
//    the pure-JavaScript client (@libsql/client/web), so there is nothing native to ship.
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
  alias: { '@libsql/client': '@libsql/client/web' },
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
})
fs.rmSync(path.join(fn, 'entry.ts'))
fs.copyFileSync(path.join(root, 'server/schema.sql'), path.join(fn, 'schema.sql'))
const nodeMajor = process.versions.node.split('.')[0]
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
