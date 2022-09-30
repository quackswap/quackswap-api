/* eslint-disable no-underscore-dangle */
import Redis from 'ioredis'

const createRetryStrategy = times => Math.min(times * 100, 3000)

const _clients = {}

const createClient = opts => new Promise((resolve, reject) => {
  const key = `${opts.host}:${opts.port}`

  if(_clients[key] !== undefined) {
    return resolve(_clients[key])
  }

  const options = {
    host: opts.host,
    port: opts.port,
    password: opts.password,
    tls: opts.tls,
    retryStrategy: createRetryStrategy,
    ...opts
  }

  _clients[key] = new Redis(options)

  _clients[key].on('error', error => {
    reject(error)
    delete _clients[key]
  })

  _clients[key].on('ready', () => {
    resolve(_clients[key])
  })
})

export const createRedisClient = async ops => {
  try {
    return await createClient(ops)
  }
  catch(error) {
    throw new Error(`Could not create a new redis client: ${error.message}`)
  }
}
