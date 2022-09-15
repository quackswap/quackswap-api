import {
  getTvl,
  getVolume,
  getSupply,
  getSupplyWhole,
  getCirculating,
  getCirculatingWhole
} from './api.js'

export const routes = {
  '/quack/tvl': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getTvl
  },
  '/quack/total-volume': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getVolume
  },
  '/quack/total-supply': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getSupply
  },
  '/quack/total-supply-whole': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getSupplyWhole
  },
  '/quack/circulating-supply': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getCirculating
  },
  '/quack/circulating-supply-whole': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getCirculatingWhole
  }
}
