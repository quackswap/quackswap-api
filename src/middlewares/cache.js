/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
import {StatusCodes} from 'http-status-codes'
import {createRedisClient} from '../distributed/index.js'
import redLock from '../distributed/locks/index.js'
import logger from '../common/logger/index.js'

let _cache
let _lock

const getCache = async ttl => {
  if(_cache === undefined) {
    const client = await createRedisClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      ttl
    })

    _cache = {
      get: client.get.bind(client),
      set: client.set.bind(client),
      expire: client.expire.bind(client)
    };
  }

  return _cache
}

const getLock = async () => {
  if(_lock === undefined) {
    _lock = await redLock({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    })
  }

  return _lock
}

const getKey = (ctx, endpoint, props) => {
  let key = endpoint

  if(props.includes('qs')) {
    key = `${key}${JSON.stringify(ctx.request.query)}`
  }
  if(props.includes('params')) {
    key = `${key}${JSON.stringify(ctx.request.params)}`
  }

  return key
}

const updateCacheEntry = async (cache, key, ttl, result = {}) => {
  try {
    await cache.set(key, JSON.stringify(result))
    await cache.expire(key, ttl)
  }
  catch(error) {
    logger.error(`Error updating the cache entry ${error.message}`)
  }
}

const processNext = async (cache, ttl, key, ctx, next) => {
  try {
    await next()

    const result = ctx.response.body
    ctx.body = result

    await updateCacheEntry(cache, key, ttl, result)
  }
  catch(error) {
    ctx.throw(StatusCodes.INTERNAL_SERVER_ERROR, error)
  }
}

const createLock = async key => {
  try {
    const lock = await getLock()
    return await lock.acquireLock(key)
  }
  catch(error) {
    logger.error(`Error getting a lock ${error.message}`)

    return null
  }
}

const getCachedItem = async (cache, key) => {
  try {
    return await cache.get(key)
  }
  catch(error) {
    logger.error(`Error reading from the cache lock ${error.message}`)

    return null
  }
}

const processRequest = async (
  ctx,
  next,
  cache,
  key,
  ttl
) => {
  const releaseLock = await createLock(key)

  try {
    const cached = await getCachedItem(cache, key)

    if(!cached) {
      return await processNext(cache, ttl, key, ctx, next)
    }

    ctx.body = JSON.parse(cached)
  }
  finally {
    releaseLock && await releaseLock()
  }
}

// 1 min default ttl
const cache = (endpoint, props = '', ttl = 60) => async (ctx, next) => {
  const key = getKey(ctx, endpoint, props)
  let cache
  let cached

  try {
    cache = await getCache(ttl)
    cached = await cache.get(key)
  }
  catch(error) {
    return await next()
  }

  if(!cached) {
    await processRequest(
      ctx,
      next,
      cache,
      key,
      ttl
    )
  }
  else {
    ctx.body = JSON.parse(cached)
  }
}

export default cache
