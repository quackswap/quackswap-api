import cors from 'kcors'
import bodyParser from 'koa-bodyparser'
import compose from 'koa-compose'

const setup = () => {
  const corsOptions = {
    'Access-Control-Allow-Headers': ['content-type', 'x-auth-source', 'x-auth-token']
  }

  return compose([
    cors(corsOptions),
    bodyParser(),
    async (ctx, next) => {
      try {
        await next()
      }
      catch(err) {
        ctx.status = err.status || 500
        ctx.body = err.message
      }
    }
  ])
}

export default setup
