import {createBasicResponse, throwWithError} from '../utils/api.js'
import {getChainInfo} from '../utils/chain.js'
import {getBalance, getTotalSupply} from '../utils/calls.js'
import {ONE_TOKEN} from '../utils/constants.js'
import * as gql from '../utils/gql.js'
import * as QUERIES from '../utils/queries.js'
import logger from '../common/logger/index.js'

export const getTvl = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain);

    const result = await gql.request(
      QUERIES._FACTORY(chainInfo.factory.toLowerCase()),
      chainInfo.subgraph_exchange,
    );
  
    const tvl = Number.parseFloat(result.quackSwapFactories[0].totalLiquidityUSD).toFixed(2);
    createBasicResponse(ctx, tvl)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getVolume = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain);

    const result = await gql.request(
      QUERIES._FACTORY(chainInfo.factory.toLowerCase()),
      chainInfo.subgraph_exchange,
    );
  
    const volume = Number.parseFloat(result.quackSwapFactories[0].totalVolumeUSD).toFixed(2);
    createBasicResponse(ctx, volume)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getSupply = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain);

    const totalSupply = await getTotalSupply(chainInfo.rpc, chainInfo.quack.toLowerCase());
    const supply = totalSupply.toString();
  
    createBasicResponse(ctx, supply)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getSupplyWhole = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain);

    const totalSupply = await getTotalSupply(chainInfo.rpc, chainInfo.quack.toLowerCase());
    const supply = totalSupply.div(ONE_TOKEN).toString();
  
    createBasicResponse(ctx, supply)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getCirculating = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain);

    const res = (await getTotalSupply(chainInfo.rpc, chainInfo.quack.toLowerCase())).toString();
  
    createBasicResponse(ctx, res)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getCirculatingWhole = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain);

    const res = (await getTotalSupply(chainInfo.rpc, chainInfo.quack))
      .div(ONE_TOKEN)
      .toString();
  
    createBasicResponse(ctx, res)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}
