import {getVersion} from './api.js'

export const routes = {
  '/version': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getVersion
  }
}
