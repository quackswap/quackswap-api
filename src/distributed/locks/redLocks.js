import Redlock from 'redlock'
import {createRedisClient} from '../redisCache.js'

let _redlock = null
let _lock = null

const lockOptions = {
  // the expected clock drift; for more details
  // see http://redis.io/topics/distlock
  driftFactor: 0.01, // multiplied by lock ttl to determine drift time

  // the max number of times Redlock will attempt
  // to lock a resource before erroring
  retryCount: -1,

  // the time in ms between attempts
  retryDelay: 250, // time in ms

  // the max time in ms randomly added to retries
  // to improve performance under high contention
  // see https://www.awsarchitectureblog.com/2015/03/backoff.html
  retryJitter: 100 // time in ms
}

// the maximum amount of time you want the resource locked in milliseconds,
// keeping in mind that you can extend the lock up until
// the point when it expires
const ttl = 30000

const releaseLock = async (lock, key) => {
  try {
    return await lock.unlock(`locks:${key}`, ttl)
  }
  catch(error) {
    throw new Error('Error releasing a lock')
  }
}

const releaseLockWithValueAndKey = async (value, key) => {
  try {
    const lock = {
      resource: [`locks:${key}`],
      value
    }

    return await _redlock.unlock(lock)
  }
  catch(error) {
    throw new Error('Error releasing a lock')
  }
}

const acquireLockWithValue = async (key, customTtl = ttl) => {
  try {
    const lock = await _redlock.lock(`locks:${key}`, customTtl)

    return lock
  }
  catch(error) {
    throw new Error('Error getting a lock')
  }
}

const acquireLock = async (key, customTtl = ttl) => {
  try {
    const lock = await _redlock.lock(`locks:${key}`, customTtl)

    return async () => {
      await releaseLock(lock, key)
    }
  }
  catch(error) {
    throw new Error('Error getting a lock')
  }
}

export const createLock = async opts => {
  if(_lock !== null) {
    return _lock
  }

  const redisClient = await createRedisClient(opts)
  _redlock = new Redlock([redisClient], lockOptions)

  _lock = {
    acquireLock,
    releaseLockWithValueAndKey,
    acquireLockWithValue
  }

  return _lock
}
