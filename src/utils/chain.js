import {ChainId, CHAINS} from '@quackswap/sdk';

export function getChainInfo(chainString) {
  if (chainString === undefined) chainString = ChainId.BITTORRENT_MAINNET.toString();
  let chainId;

  if (chainString in ChainId) {
    chainId = Number(chainString);
  } else {
    throw new Error(`Chain ${chainString} is not yet supported`);
  }

  const chain = CHAINS[chainId];

  if (!chain.quackswap_is_live) {
    throw new Error(`QuackSwap is not live on chain ${chainString}`);
  }

  const DEFAULT = '';

  const chainInfo = {
    chainId: chain.chain_id.toString(),
    quack: chain.contracts?.quack_token ?? DEFAULT,
    wrapped_native_token: chain.contracts?.wrapped_native_token ?? DEFAULT,
    master_chef: chain.contracts?.master_chef ?? DEFAULT,
    factory: chain.contracts?.factory ?? DEFAULT,

    community_treasury: chain.contracts?.community_treasury ?? DEFAULT,
    treasury_vester: chain.contracts?.treasury_vester ?? DEFAULT,

    rpc: chain.rpc_uri,
    subgraph_exchange: chain.subgraph?.exchange ?? DEFAULT,
  };

  // if (Object.values(chainInfo).includes(DEFAULT)) {
  //   throw new Error(`Missing chain info value`);
  // }

  return chainInfo;
}
