import {Chain, ChainId, CHAINS} from '@quackswap/sdk';

export interface ChainInfo {
  chainId: string;
  quack: string;
  wrapped_native_token: string;
  mini_chef: string;
  factory: string;
  community_treasury: string;
  treasury_vester: string;
  rpc: string;
  subgraph_exchange: string;
}

export function getChainInfo(chainString: string | undefined): ChainInfo {
  if (chainString === undefined) chainString = ChainId.BITTORRENT_MAINNET.toString();
  let chainId: ChainId;

  if (chainString in ChainId) {
    chainId = Number(chainString);
  } else {
    throw new Error(`Chain ${chainString} is not yet supported`);
  }

  const chain: Chain = CHAINS[chainId];

  if (!chain.quackswap_is_live) {
    throw new Error(`QuackSwap is not live on chain ${chainString}`);
  }

  const DEFAULT = '';

  const chainInfo = {
    chainId: chain.chain_id.toString(),
    quack: chain.contracts?.quack ?? DEFAULT,
    wrapped_native_token: chain.contracts?.wrapped_native_token ?? DEFAULT,
    mini_chef: chain.contracts?.mini_chef ?? DEFAULT,
    factory: chain.contracts?.factory ?? DEFAULT,

    community_treasury: chain.contracts?.community_treasury ?? DEFAULT,
    treasury_vester: chain.contracts?.treasury_vester ?? DEFAULT,

    rpc: chain.rpc_uri,
    subgraph_exchange: chain.subgraph?.exchange ?? DEFAULT,
  };

  if (Object.values(chainInfo).includes(DEFAULT)) {
    throw new Error(`Missing chain info value`);
  }

  return chainInfo;
}
