import {BigNumber} from '@ethersproject/bignumber'
import {createBasicResponse, throwWithError} from '../utils/api.js'
import {getChainInfo} from '../utils/chain.js'
import {
  getBalance,
  getDecimals,
  getTotalSupply,
  getPoolTokens,
  getStakingTokenAddressFromMasterChef,
  getRewardPerSecondFromMasterChef,
  getTotalAllocationPointsFromMasterChef,
  getPoolInfoFromMasterChef,
  getStakingTokenAddressesFromMasterChef,
  getRewarder,
  getRewarderViaMultiplierGetRewardTokens,
  getRewarderViaMultiplierPendingTokens
} from '../utils/calls.js'
import {expandTo18Decimals, convertStringToBigNumber} from '../utils/conversion.js';
import {ONE_TOKEN, ZERO_ADDRESS, ZERO} from '../utils/constants.js'
import {getETHPrice, getPairPriceUSD, getTokenPriceETH} from '../utils/gql.js';
import * as gql from '../utils/gql.js'
import * as QUERIES from '../utils/queries.js'
import logger from '../common/logger/index.js'

export const getAddresses = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain);

    let number_addresses = 0;
    let new_addrs = 0;
    let firstUser = ZERO_ADDRESS;
  
    do {
      const {users} = await gql.request(QUERIES.USER, chainInfo.subgraph_exchange, {
        first: 1000,
        firstUser,
        orderBy: 'id',
      });
      firstUser = users[users.length - 1].id;
      new_addrs = users.length;
      number_addresses += new_addrs;
    } while (new_addrs === 1000);

    createBasicResponse(ctx, number_addresses)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getAverage = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain)
  
    const result = await gql.request(
      QUERIES._FACTORY(chainInfo.factory.toLowerCase()),
      chainInfo.subgraph_exchange,
    );
    const {totalVolumeUSD, txCount} = result.quackSwapFactories[0];

    const average = (Number.parseFloat(totalVolumeUSD) / Number.parseInt(txCount, 10)).toFixed(2);

    createBasicResponse(ctx, average)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const aprLegacy = async ctx => {
  try {
    const aprs = {
      swapFeeApr: 0,
      stakingApr: 0,
      combinedApr: 0,
    }

    createBasicResponse(ctx, aprs)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getAprChef = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain)
    const aprs = {
      swapFeeApr: 0,
      stakingApr: 0,
      combinedApr: 0,
    };
  
    const poolId = ctx.params.pid;
  
    const stakingTokenAddress = await getStakingTokenAddressFromMasterChef(
      chainInfo.rpc,
      chainInfo.master_chef.toLowerCase(),
      poolId,
    );

    // Number of days to average swap volume from
    const days = 7;

    const [
      {pairDayDatas},
      bttPriceString,
      derivedQuackString,
      pairValueUSD,
      [token0, token1],
      rewardPerSecond,
      poolInfo,
      totalAllocPoints,
      rewarderAddress,
      pglTotalSupply,
      pglStaked,
    ] = await Promise.all([
      // Swap volume over 7 days
      gql.request(QUERIES.DAILY_VOLUME, chainInfo.subgraph_exchange, {
        days,
        pairAddress: stakingTokenAddress,
      }),

      // BTT price in terms of USD
      getETHPrice(chainInfo.subgraph_exchange),

      // QUACK price in terms of BTT
      getTokenPriceETH(chainInfo.subgraph_exchange, chainInfo.quack.toLowerCase()),

      // Get pool USD reserve value
      getPairPriceUSD(chainInfo.subgraph_exchange, stakingTokenAddress),

      // Get the two token addresses in the pool
      getPoolTokens(chainInfo.rpc, stakingTokenAddress),

      // Current staking reward rate
      getRewardPerSecondFromMasterChef(chainInfo.rpc, chainInfo.master_chef.toLowerCase()),

      // Pool information especially allocation points
      getPoolInfoFromMasterChef(chainInfo.rpc, chainInfo.master_chef.toLowerCase(), poolId),

      // Total allocation points
      getTotalAllocationPointsFromMasterChef(chainInfo.rpc, chainInfo.master_chef.toLowerCase()),

      // Rewarder address
      getRewarder(chainInfo.rpc, chainInfo.master_chef.toLowerCase(), poolId),

      getTotalSupply(chainInfo.rpc, stakingTokenAddress),

      getBalance(chainInfo.rpc, stakingTokenAddress, chainInfo.master_chef.toLowerCase()),
    ]);

    const bttPrice = convertStringToBigNumber(bttPriceString, 0, 18);
    const quackPrice = convertStringToBigNumber(derivedQuackString, 0, 18)
      .mul(bttPrice)
      .div(ONE_TOKEN);

    // Process additional SuperFarm rewards
    let extraRewardTokensPerSecondInQUACK = ZERO;
    if (rewarderAddress !== ZERO_ADDRESS) {
      const [superFarmRewardTokens, [, superFarmMultipliers]] = await Promise.all(
        [
          getRewarderViaMultiplierGetRewardTokens(chainInfo.rpc, rewarderAddress),
          getRewarderViaMultiplierPendingTokens(
            chainInfo.rpc,
            rewarderAddress,
            ZERO_ADDRESS,
            ONE_TOKEN.toString(),
          ),
        ],
      );

      const [rewardDecimals, rewardTokenPricesInQUACK] = await Promise.all([
        Promise.all(
          superFarmRewardTokens.map(async (address) => getDecimals(chainInfo.rpc, address)),
        ),
        Promise.all(
          superFarmRewardTokens.map(async (address) => { // eslint-disable-line
            return getTokenPriceETH(chainInfo.subgraph_exchange, address).then(
              (derivedBTT) =>
                convertStringToBigNumber(derivedBTT, 0, 18).mul(bttPrice).div(quackPrice),
            );
          }),
        ),
      ]);

      for (let i = 0; i < superFarmRewardTokens.length; i++) {
        const rewardPerSecInReward = rewardPerSecond
          .mul(poolInfo.allocPoint)
          .div(totalAllocPoints)
          .mul(superFarmMultipliers[i])
          .div(ONE_TOKEN)
          .mul(rewardTokenPricesInQUACK[i])
          .div(ONE_TOKEN);

        const rewardPerSecInQUACK = expandTo18Decimals(rewardPerSecInReward, rewardDecimals[i]);
        extraRewardTokensPerSecondInQUACK = extraRewardTokensPerSecondInQUACK.add(rewardPerSecInQUACK);
      }
    }

    let stakedQUACK;
    if ([token0, token1].includes(chainInfo.quack.toLowerCase())) {
      const halfPairValueInQUACK = await getBalance(
        chainInfo.rpc,
        chainInfo.quack.toLowerCase(),
        stakingTokenAddress,
      );
      stakedQUACK = halfPairValueInQUACK.mul(2).mul(pglStaked).div(pglTotalSupply);
    } else {
      
      const pairValueInQUACK = convertStringToBigNumber(pairValueUSD, 0, 18)
        .mul(ONE_TOKEN)
        .div(quackPrice);
      stakedQUACK = pairValueInQUACK.mul(pglStaked).div(pglTotalSupply);
    }

    const poolRewardPerSecInQUACK = rewardPerSecond
    .mul(poolInfo.allocPoint)
    .div(totalAllocPoints);
    const stakingAPR = stakedQUACK.isZero()
      ? ZERO
      : poolRewardPerSecInQUACK
          .add(extraRewardTokensPerSecondInQUACK)
          // Percentage
          .mul(100)
          // Calculate reward rate per year
          .mul(60 * 60 * 24 * 365)
          // Divide by amount staked to get APR
          .div(stakedQUACK);

    let swapVolumeUSD = ZERO;
    let liquidityUSD = ZERO;

    for (const {dailyVolumeUSD, reserveUSD} of pairDayDatas) {
      swapVolumeUSD = swapVolumeUSD.add(Math.floor(dailyVolumeUSD));
      liquidityUSD = liquidityUSD.add(Math.floor(reserveUSD));
    }

    const fees = swapVolumeUSD.mul(365).div(pairDayDatas.length).mul(3).div(1000);
    const averageLiquidityUSD = liquidityUSD.div(pairDayDatas.length);
    const swapFeeAPR = averageLiquidityUSD.isZero() ? ZERO : fees.mul(100).div(averageLiquidityUSD);
    const combinedAPR = stakingAPR.add(swapFeeAPR);

    aprs.swapFeeApr = swapFeeAPR.toNumber();
    aprs.stakingApr = stakingAPR.toNumber();
    aprs.combinedApr = combinedAPR.toNumber();
  
    createBasicResponse(ctx, aprs)
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}

export const getStakingTokenAddresses = async ctx => {
  try {
    const {chain} = ctx.request.query
    const chainInfo = getChainInfo(chain)

    const stakingTokenAddresses = await getStakingTokenAddressesFromMasterChef(
      chainInfo.rpc,
      chainInfo.master_chef.toLowerCase(),
    );

    createBasicResponse(ctx, stakingTokenAddresses?.[0])
  }
  catch(error) {
    logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}
