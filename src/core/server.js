/* eslint-disable no-restricted-syntax */
import http from 'http'
import https from 'https'
import Koa from 'koa'
import Router from '@koa/router'
import fs from 'fs'

import setupRoutes from './router.js'
import setupMiddlewares from '../middlewares/index.js'
// import {redis} from '../../data/index.js'
// import logger from '../../common/logger'

const start = async routes => {
  const app = new Koa()
  const router = setupRoutes(Router(), routes)

  // redis.initDB(
  //   process.env.REDIS_HOST,
  //   process.env.REDIS_PORT,
  //   process.env.REDIS_PASSWORD
  // )

  app
    .use(setupMiddlewares())
    .use(router.routes())
    .use(router.allowedMethods())

  if(process.env.NODE_ENV === 'development') {
    const key = fs.readFileSync('./certs/server.key', 'utf8')
    const cert = fs.readFileSync('./certs/server.crt', 'utf8')
    const credentials = {key, cert}

    https
      .createServer(credentials, app.callback())
      .listen(process.env.SERVER_HTTPS_PORT, () => {
        // logger.info(`Koa https server listening on port ${process.env.SERVER_HTTPS_PORT} and worker ${process.pid}`)
        console.log(`Koa https server listening on port ${process.env.SERVER_HTTPS_PORT} and worker ${process.pid}`)
      })
  }
  
  http
    .createServer(app.callback())
    .listen(process.env.SERVER_PORT, () => {
      // logger.info(`Koa http server listening on port ${process.env.SERVER_PORT}`)
      console.log(`Koa http server listening on port ${process.env.SERVER_PORT}`)
    })
}

export default start
