import {Interface} from '@ethersproject/abi';
import {BigNumber} from '@ethersproject/bignumber';
import {hexStripZeros, hexZeroPad} from '@ethersproject/bytes';
import fetch from 'node-fetch';
import {ERC20_ABI, MASTERCHEF_ABI, PAIR_ABI, REWARDER_VIA_MULTIPLIER_ABI} from '../utils/constants.js';

export function normalizeAddress(address) {
  return hexZeroPad(hexStripZeros(address), 20);
}

const getStakingTokenAddressFromMasterChefCache = {};
export async function getStakingTokenAddressFromMasterChef(
  rpc,
  chefAddress,
  pid,
) {
  const key = `${rpc}${chefAddress}${pid}`;

  let result = getStakingTokenAddressFromMasterChefCache[key];
  if (result !== undefined) return result;

  result = normalizeAddress(await call(rpc, MASTERCHEF_ABI, chefAddress, 'lpToken', [pid]));

  getStakingTokenAddressFromMasterChefCache[key] = result;
  return result;
}

export async function getStakingTokenAddressesFromMasterChef(
  rpc,
  chefAddress,
) {
  const iface = new Interface(MASTERCHEF_ABI);
  const response = await call(rpc, MASTERCHEF_ABI, chefAddress, 'lpTokens');
  return iface.decodeFunctionResult('lpTokens', response);
}

export async function getRewardPerSecondFromMasterChef(
  rpc,
  chefAddress,
) {
  return BigNumber.from(await call(rpc, MASTERCHEF_ABI, chefAddress, 'rewardPerSecond'));
}

export async function getPoolInfoFromMasterChef(
  rpc,
  chefAddress,
  pid,
) {
  const iface = new Interface(MASTERCHEF_ABI);
  const response = await call(rpc, MASTERCHEF_ABI, chefAddress, 'poolInfo', [pid]);
  return iface.decodeFunctionResult('poolInfo', response);
}

export async function getPoolInfosFromMasterChef(
  rpc,
  chefAddress,
) {
  const iface = new Interface(MASTERCHEF_ABI);
  const response = await call(rpc, MASTERCHEF_ABI, chefAddress, 'poolInfos');
  const decoded = iface.decodeFunctionResult('poolInfos', response);
  return (decoded[0]).map((data) => ({
    accRewardPerShare: data[0],
    lastRewardTime: data[1],
    allocPoint: data[2],
  }));
}

export async function getRewarder(rpc, chefAddress, pid) {
  return normalizeAddress(await call(rpc, MASTERCHEF_ABI, chefAddress, 'rewarder', [pid]));
}

export async function getTotalAllocationPointsFromMasterChef(
  rpc,
  chefAddress,
) {
  return BigNumber.from(await call(rpc, MASTERCHEF_ABI, chefAddress, 'totalAllocPoint'));
}

export async function getRewarderViaMultiplierGetRewardTokens(
  rpc,
  rewarderAddress,
) {
  const iface = new Interface(REWARDER_VIA_MULTIPLIER_ABI);
  const response = await call(rpc, REWARDER_VIA_MULTIPLIER_ABI, rewarderAddress, 'getRewardTokens');
  const decoded = iface.decodeFunctionResult('getRewardTokens', response);
  return decoded[0].map((address) => normalizeAddress(address)); // eslint-disable-line
}

export async function getRewarderViaMultiplierPendingTokens(
  rpc,
  rewarderAddress,
  user,
  rewardAmount,
) {
  const iface = new Interface(REWARDER_VIA_MULTIPLIER_ABI);
  const response = await call(rpc, REWARDER_VIA_MULTIPLIER_ABI, rewarderAddress, 'pendingTokens', [
    0,
    user,
    rewardAmount,
  ]);
  return iface.decodeFunctionResult('pendingTokens', response);
}

export async function getTotalSupply(rpc, address) {
  return BigNumber.from(await call(rpc, ERC20_ABI, address, 'totalSupply'));
}

const getDecimalsCache= {};
export async function getDecimals(rpc, address) {
  const key = `${rpc}${address}`;

  let result = getDecimalsCache[key];
  if (result !== undefined) return result;

  result = BigNumber.from(await call(rpc, ERC20_ABI, address, 'decimals'));

  getDecimalsCache[key] = result;
  return result;
}

const getPoolTokensCache = {};
export async function getPoolTokens(rpc, address) {
  const key = `${rpc}${address}`;

  let result = getPoolTokensCache[key];
  if (result !== undefined) return result;

  const [token0, token1] = await Promise.all([
    call(rpc, PAIR_ABI, address, 'token0'),
    call(rpc, PAIR_ABI, address, 'token1'),
  ]);

  result = [normalizeAddress(token0), normalizeAddress(token1)];

  getPoolTokensCache[key] = result;
  return result;
}

export async function getBalance(rpc, erc20, address) {
  return BigNumber.from(await call(rpc, ERC20_ABI, erc20, 'balanceOf', [address]));
}

export async function call(
  rpc,
  abi,
  toAddress,
  functionName,
  functionData = [],
) {
  const iface = new Interface(abi);

  const _ = await fetch(rpc, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: toAddress,
          data: iface.encodeFunctionData(functionName, functionData),
        },
        'latest',
      ],
    }),
  });

  if (_.status !== 200) {
    const message = `[${_.statusText}]: Error fetching ${toAddress}.${functionName}(...)`;
    console.error(message);
    throw new Error(message);
  }

  const {result} = await _.json();

  return result;
}
