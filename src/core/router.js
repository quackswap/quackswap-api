import cacheMiddleware from '../middlewares/cache.js'

const setup = (router, routes) => {
  routes.forEach(route => {
    Object.entries(route).forEach(([endpoint, endpointDef]) => {
      const {
        method,
        cache,
        fn
      } = endpointDef
      let {middlewares = []} = endpointDef

      if(cache) {
        middlewares = [
          ...middlewares,
          cacheMiddleware(endpoint, cache.props, cache.ttl)
        ]
      }

      router[method](endpoint.replace(/[$]*/g, ''), ...middlewares, fn)
    })
  })

  return router
}

export default setup
