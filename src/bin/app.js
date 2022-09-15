import startServer from '../core/server.js'
import coreRoutes from '../core/routes.js'

const start = async routes => {
  await startServer(routes)
}

export const createApp = async () => {
  await start(coreRoutes)
}
