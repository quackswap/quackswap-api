import startServer from '../src/core/server.js'
import coreRoutes from '../src/core/routes.js'

const start = async routes => {
  await startServer(routes)
}

export const createApp = async () => {
  await start(coreRoutes)
}
