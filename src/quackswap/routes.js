import {
  getAddresses,
  getAverage,
  aprLegacy,
  getAprChef,
  getStakingTokenAddresses
} from './api.js'

export const routes = {
  '/quackswap/addresses': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getAddresses
  },
  '/quackswap/transaction-average': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getAverage
  },
  '/quackswap/apr/:address': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: aprLegacy
  },
  '/quackswap/apr2/:pid': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getAprChef
  },
  '/quackswap/stakingTokenAddresse': {
    method: 'get',
    middlewares: [],
    cache: {
      props: ['qs']
    },
    fn: getStakingTokenAddresses
  }
}
