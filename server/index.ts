import app from './app.ts'

const port = Number(process.env.PORT) || 3001
const server = app.listen(port, () => {
  console.log(`Shiloh API running on http://localhost:${port}`)
})
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') console.error(`Port ${port} is already in use. Close the other app using it and try again.`)
  else console.error(error)
  process.exit(1)
})
