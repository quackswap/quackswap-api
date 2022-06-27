import {Router} from 'worktop';
import * as Cache from 'worktop/cache';
import * as CORS from 'worktop/cors';
import {send} from 'worktop/response';
import * as QuackSwap from './handlers/quackswap';
import * as Quack from './handlers/quack';

const API = new Router();

API.prepare = CORS.preflight({
  origin: true,
  headers: ['Cache-Control', 'Content-Type'],
  methods: ['GET'],
});

API.add('GET', '/', () => {
  const text = 'Refer to https://github.com/quackswapdex/quackswap-api for documentation.';

  return send(200, text, {
    'Cache-Control': 'public,s-maxage=31536000,immutable',
  });
});

// Legacy API
API.add('GET', '/quack/tvl', Quack.tvl);
API.add('GET', '/quack/total-volume', Quack.volume);
API.add('GET', '/quack/total-supply', Quack.supply);
API.add('GET', '/quack/total-supply-whole', Quack.supplyWhole);
API.add('GET', '/quack/circulating-supply', Quack.circulating);
API.add('GET', '/quack/circulating-supply-whole', Quack.circulatingWhole);
API.add('GET', '/quack/community-treasury', Quack.treasury);
API.add('GET', '/quack/community-treasury-whole', Quack.treasuryWhole);
API.add('GET', '/quackswap/addresses', QuackSwap.addresses);
API.add('GET', '/quackswap/transaction-average', QuackSwap.average);
API.add('GET', '/quackswap/apr/:address', QuackSwap.aprLegacy);
API.add('GET', '/quackswap/apr2/:pid', QuackSwap.aprChef);
API.add('GET', '/quackswap/stakingTokenAddresses', QuackSwap.stakingTokenAddresses);

// V2 API
API.add('GET', '/v2/:chain/quack/tvl', Quack.tvl);
API.add('GET', '/v2/:chain/quack/total-volume', Quack.volume);
API.add('GET', '/v2/:chain/quack/total-supply', Quack.supply);
API.add('GET', '/v2/:chain/quack/total-supply-whole', Quack.supplyWhole);
API.add('GET', '/v2/:chain/quack/circulating-supply', Quack.circulating);
API.add('GET', '/v2/:chain/quack/circulating-supply-whole', Quack.circulatingWhole);
API.add('GET', '/v2/:chain/quack/community-treasury', Quack.treasury);
API.add('GET', '/v2/:chain/quack/community-treasury-whole', Quack.treasuryWhole);
API.add('GET', '/v2/:chain/quackswap/addresses', QuackSwap.addresses);
API.add('GET', '/v2/:chain/quackswap/transaction-average', QuackSwap.average);
API.add('GET', '/v2/:chain/quackswap/apr/:pid', QuackSwap.aprChef);
API.add('GET', '/v2/:chain/quackswap/aprs/:pids', QuackSwap.aprChefMultiple);
API.add('GET', '/v2/:chain/quackswap/stakingTokenAddresses', QuackSwap.stakingTokenAddresses);

Cache.listen(async (event) => {
  return API.run(event.request, event);
});
