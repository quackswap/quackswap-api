import {Result} from '@ethersproject/abi';
import {BigNumber} from '@ethersproject/bignumber';
import type {Handler} from 'worktop';
import {send} from 'worktop/response';
import {ZERO_ADDRESS, ZERO, ONE_TOKEN} from '../constants';
import {
  getBalance,
  getDecimals,
  getTotalSupply,
  getPoolTokens,
  getStakingTokenAddressFromMiniChefV2,
  getRewardPerSecondFromMiniChefV2,
  getTotalAllocationPointsFromMiniChefV2,
  getPoolInfoFromMiniChefV2,
  getStakingTokenAddressesFromMiniChefV2,
  getRewarder,
  getRewarderViaMultiplierGetRewardTokens,
  getRewarderViaMultiplierPendingTokens,
  getPoolInfosFromMiniChefV2,
} from '../utils/calls';
import {getChainInfo} from '../utils/chain';
import {expandTo18Decimals, convertStringToBigNumber} from '../utils/conversion';
import * as gql from '../utils/gql';
import {getETHPrice, getPairPriceUSD, getTokenPriceETH} from '../utils/gql';
import * as QUERIES from '../utils/queries';

export const addresses: Handler = async (_, context) => {
  const chainInfo = getChainInfo(context.params.chain);

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

  return send(200, number_addresses, {
    'Cache-Control': 'public,s-maxage=86400',
  });
};

export const average: Handler = async (_, context) => {
  const chainInfo = getChainInfo(context.params.chain);

  const result = await gql.request(
    QUERIES._FACTORY(chainInfo.factory),
    chainInfo.subgraph_exchange,
  );
  const {totalVolumeUSD, txCount} = result.quackswapFactories[0];

  const text = (Number.parseFloat(totalVolumeUSD) / Number.parseInt(txCount, 10)).toFixed(2);

  return send(200, text, {
    'Cache-Control': 'public,s-maxage=86400',
  });
};

export const aprLegacy: Handler = async () => {
  const aprs = {
    swapFeeApr: 0,
    stakingApr: 0,
    combinedApr: 0,
  };

  return send(200, aprs, {
    'Cache-Control': 'public,s-maxage=86400',
  });
};

export const aprChef: Handler = async (_, context) => {
  const chainInfo = getChainInfo(context.params.chain);

  const aprs = {
    swapFeeApr: 0,
    stakingApr: 0,
    combinedApr: 0,
  };

  const poolId = context.params.pid;

  try {
    const stakingTokenAddress = await getStakingTokenAddressFromMiniChefV2(
      chainInfo.rpc,
      chainInfo.mini_chef,
      poolId,
    );

    // Number of days to average swap volume from
    const days = 7;

    const [
      {pairDayDatas},
      avaxPriceString,
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

      // AVAX price in terms of USD
      getETHPrice(chainInfo.subgraph_exchange),

      // QUACK price in terms of AVAX
      getTokenPriceETH(chainInfo.subgraph_exchange, chainInfo.quack),

      // Get pool USD reserve value
      getPairPriceUSD(chainInfo.subgraph_exchange, stakingTokenAddress),

      // Get the two token addresses in the pool
      getPoolTokens(chainInfo.rpc, stakingTokenAddress),

      // Current staking reward rate
      getRewardPerSecondFromMiniChefV2(chainInfo.rpc, chainInfo.mini_chef),

      // Pool information especially allocation points
      getPoolInfoFromMiniChefV2(chainInfo.rpc, chainInfo.mini_chef, poolId),

      // Total allocation points
      getTotalAllocationPointsFromMiniChefV2(chainInfo.rpc, chainInfo.mini_chef),

      // Rewarder address
      getRewarder(chainInfo.rpc, chainInfo.mini_chef, poolId),

      getTotalSupply(chainInfo.rpc, stakingTokenAddress),

      getBalance(chainInfo.rpc, stakingTokenAddress, chainInfo.mini_chef),
    ]);

    const avaxPrice = convertStringToBigNumber(avaxPriceString, 0, 18);
    const quackPrice = convertStringToBigNumber(derivedQuackString, 0, 18)
      .mul(avaxPrice)
      .div(ONE_TOKEN);

    // Process additional SuperFarm rewards
    let extraRewardTokensPerSecondInQUACK = ZERO;
    if (rewarderAddress !== ZERO_ADDRESS) {
      const [superFarmRewardTokens, [, superFarmMultipliers]] = await Promise.all<string[], Result>(
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

      const [rewardDecimals, rewardTokenPricesInQUACK] = await Promise.all<BigNumber[], BigNumber[]>([
        Promise.all<BigNumber>(
          superFarmRewardTokens.map(async (address: string) => getDecimals(chainInfo.rpc, address)),
        ),
        Promise.all<BigNumber>(
          superFarmRewardTokens.map(async (address: string) => { // eslint-disable-line
            return getTokenPriceETH(chainInfo.subgraph_exchange, address).then(
              (derivedAVAX: string) =>
                convertStringToBigNumber(derivedAVAX, 0, 18).mul(avaxPrice).div(quackPrice),
            );
          }),
        ),
      ]);

      for (let i = 0; i < superFarmRewardTokens.length; i++) {
        const rewardPerSecInReward: BigNumber = (rewardPerSecond as BigNumber)
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

    let stakedQUACK: BigNumber;
    if ([token0, token1].includes(chainInfo.quack.toLowerCase())) {
      const halfPairValueInQUACK: BigNumber = await getBalance(
        chainInfo.rpc,
        chainInfo.quack,
        stakingTokenAddress,
      );
      stakedQUACK = halfPairValueInQUACK.mul(2).mul(pglStaked).div(pglTotalSupply);
    } else {
      const pairValueInQUACK: BigNumber = convertStringToBigNumber(pairValueUSD, 0, 18)
        .mul(ONE_TOKEN)
        .div(quackPrice);
      stakedQUACK = pairValueInQUACK.mul(pglStaked).div(pglTotalSupply);
    }

    const poolRewardPerSecInQUACK: BigNumber = (rewardPerSecond as BigNumber)
      .mul(poolInfo.allocPoint)
      .div(totalAllocPoints);
    const stakingAPR: BigNumber = stakedQUACK.isZero()
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
  } catch {}

  return send(200, aprs, {
    'Cache-Control': 'public,s-maxage=120',
  });
};

export const aprChefMultiple: Handler = async (_, context) => {
  const chainInfo = getChainInfo(context.params.chain);

  const poolIds: string[] = context.params.pids.split(',');

  const aprs = poolIds.map(() => ({
    swapFeeApr: 0,
    stakingApr: 0,
    combinedApr: 0,
  }));

  // Number of days to average swap volume from
  const days = 7;

  // Singular data
  const [
    _avaxPriceString,
    _derivedQuackString,
    _lpTokens,
    poolInfos,
    rewardPerSecond,
    totalAllocPoints,
  ] = await Promise.all([
    // Variable: _avaxPriceString
    getETHPrice(chainInfo.subgraph_exchange),

    // Variable: _derivedQuackString
    getTokenPriceETH(chainInfo.subgraph_exchange, chainInfo.quack),

    // Variable: _lpTokens
    getStakingTokenAddressesFromMiniChefV2(chainInfo.rpc, chainInfo.mini_chef),

    // Variable: poolInfos
    getPoolInfosFromMiniChefV2(chainInfo.rpc, chainInfo.mini_chef),

    // Variable: rewardPerSecond
    getRewardPerSecondFromMiniChefV2(chainInfo.rpc, chainInfo.mini_chef),

    // Variable: totalAllocPoints
    getTotalAllocationPointsFromMiniChefV2(chainInfo.rpc, chainInfo.mini_chef),
  ]);

  // Format singular data
  const avaxPrice: BigNumber = convertStringToBigNumber(_avaxPriceString, 0, 18);
  const quackPrice: BigNumber = convertStringToBigNumber(_derivedQuackString, 0, 18)
    .mul(avaxPrice)
    .div(ONE_TOKEN);
  const lpTokens: string[] = _lpTokens[0];

  // Iterated data
  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < poolIds.length; i++) {
    const poolId = poolIds[i];
    try {
      const stakingTokenAddress: string = lpTokens[Number.parseInt(poolId, 10)];
      const [
        {pairDayDatas},
        pairValueUSD,
        [token0, token1],
        rewarderAddress,
        pglTotalSupply,
        pglStaked,
      ] = await Promise.all([
        // {pairDayDatas}
        gql.request(QUERIES.DAILY_VOLUME, chainInfo.subgraph_exchange, {
          days,
          pairAddress: stakingTokenAddress,
        }),

        // Variable: pairValueUSD,
        getPairPriceUSD(chainInfo.subgraph_exchange, stakingTokenAddress),

        // Variable: [token0, token1]
        getPoolTokens(chainInfo.rpc, stakingTokenAddress),

        // Variable: rewarderAddress
        getRewarder(chainInfo.rpc, chainInfo.mini_chef, poolId),

        // Variable: pglTotalSupply
        getTotalSupply(chainInfo.rpc, stakingTokenAddress),

        // Variable: pglStaked
        getBalance(chainInfo.rpc, stakingTokenAddress, chainInfo.mini_chef),
      ]);

      // Process additional SuperFarm rewards
      let extraRewardTokensPerSecondInQUACK = ZERO;
      if (rewarderAddress !== ZERO_ADDRESS) {
        const [superFarmRewardTokens, [, superFarmMultipliers]] = await Promise.all<
          string[],
          Result
        >([
          getRewarderViaMultiplierGetRewardTokens(chainInfo.rpc, rewarderAddress),
          getRewarderViaMultiplierPendingTokens(
            chainInfo.rpc,
            rewarderAddress,
            ZERO_ADDRESS,
            ONE_TOKEN.toString(),
          ),
        ]);

        const [rewardDecimals, rewardTokenPricesInQUACK] = await Promise.all<BigNumber[]>([
          Promise.all<BigNumber>(
            superFarmRewardTokens.map(async (address: string) =>
              getDecimals(chainInfo.rpc, address),
            ),
          ),
          Promise.all<BigNumber>(
            superFarmRewardTokens.map(async (address: string) => { // eslint-disable-line
              return getTokenPriceETH(chainInfo.subgraph_exchange, address).then(
                (derivedAVAX: string) =>
                  convertStringToBigNumber(derivedAVAX, 0, 18).mul(avaxPrice).div(quackPrice),
              );
            }),
          ),
        ]);

        for (let j = 0; j < superFarmRewardTokens.length; j++) {
          const rewardPerSecInReward: BigNumber = rewardPerSecond
            .mul(poolInfos[Number.parseInt(poolId, 10)].allocPoint)
            .div(totalAllocPoints)
            .mul(superFarmMultipliers[j])
            .div(ONE_TOKEN)
            .mul(rewardTokenPricesInQUACK[j])
            .div(ONE_TOKEN);

          const rewardPerSecInQUACK = expandTo18Decimals(rewardPerSecInReward, rewardDecimals[j]);
          extraRewardTokensPerSecondInQUACK = extraRewardTokensPerSecondInQUACK.add(rewardPerSecInQUACK);
        }
      }

      let stakedQUACK: BigNumber;
      if ([token0, token1].includes(chainInfo.quack.toLowerCase())) {
        const halfPairValueInQUACK: BigNumber = await getBalance(
          chainInfo.rpc,
          chainInfo.quack,
          stakingTokenAddress,
        );
        stakedQUACK = halfPairValueInQUACK.mul(2).mul(pglStaked).div(pglTotalSupply);
      } else {
        const pairValueInQUACK: BigNumber = convertStringToBigNumber(pairValueUSD, 0, 18)
          .mul(ONE_TOKEN)
          .div(quackPrice);
        stakedQUACK = pairValueInQUACK.mul(pglStaked).div(pglTotalSupply);
      }

      const poolRewardPerSecInQUACK: BigNumber = rewardPerSecond
        .mul(poolInfos[Number.parseInt(poolId, 10)].allocPoint)
        .div(totalAllocPoints);
      const stakingAPR: BigNumber = stakedQUACK.isZero()
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
      const swapFeeAPR = averageLiquidityUSD.isZero()
        ? ZERO
        : fees.mul(100).div(averageLiquidityUSD);
      const combinedAPR = stakingAPR.add(swapFeeAPR);

      aprs[i].swapFeeApr = swapFeeAPR.toNumber();
      aprs[i].stakingApr = stakingAPR.toNumber();
      aprs[i].combinedApr = combinedAPR.toNumber();
    } catch {}
  }

  return send(200, aprs, {
    'Cache-Control': 'public,s-maxage=120',
  });
};

export const stakingTokenAddresses: Handler = async (_, context) => {
  const chainInfo = getChainInfo(context.params.chain);

  const stakingTokenAddresses = await getStakingTokenAddressesFromMiniChefV2(
    chainInfo.rpc,
    chainInfo.mini_chef,
  );
  return send(200, stakingTokenAddresses?.[0], {
    'Cache-Control': 'public,s-maxage=216000',
  });
};
