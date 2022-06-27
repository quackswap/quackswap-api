import * as assert from 'uvu/assert';
import {describe, get} from './setup/env';

describe('/', (it) => {
  it('/', async () => {
    const {statusCode, data, headers} = await get('/');

    assert.is(statusCode, 200);
    assert.is(data, 'Refer to https://github.com/quackswapdex/quackswap-api for documentation.');
    assert.is(headers['cache-control'], 'public,s-maxage=31536000,immutable');
  });
});

describe('/quack', (it) => {
  it('/quack/tvl', async () => {
    const {statusCode, data, headers} = await get('/quack/tvl');

    assert.is(statusCode, 200);
    assert.match(data, /^[.?\d]+/);
    assert.is(headers['cache-control'], 'public,s-maxage=300');
  });

  it('/quack/total-volume', async () => {
    const {statusCode, data, headers} = await get('/quack/total-volume');

    assert.is(statusCode, 200);
    assert.match(data, /^[.?\d]+/);
    assert.is(headers['cache-control'], 'public,s-maxage=300');
  });

  it('/quack/total-supply', async () => {
    const {statusCode, data, headers} = await get('/quack/total-supply');

    assert.is(statusCode, 200);
    assert.is(data, '230000000000000000000000000');
    assert.is(headers['cache-control'], 'public,s-maxage=31536000,immutable');
  });

  it('/quack/total-supply-whole', async () => {
    const {statusCode, data, headers} = await get('/quack/total-supply-whole');

    assert.is(statusCode, 200);
    assert.is(data, '230000000');
    assert.is(headers['cache-control'], 'public,s-maxage=31536000,immutable');
  });

  it('/quack/circulating-supply', async () => {
    const {statusCode, data, headers} = await get('/quack/circulating-supply');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=86400');
  });

  it('/quack/circulating-supply-whole', async () => {
    const {statusCode, data, headers} = await get('/quack/circulating-supply-whole');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=86400');
  });

  it('/quack/community-treasury', async () => {
    const {statusCode, data, headers} = await get('/quack/community-treasury');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=3600');
  });

  it('/quack/community-treasury-whole', async () => {
    const {statusCode, data, headers} = await get('/quack/community-treasury-whole');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=3600');
  });
});

describe('/v2/:chain/quack', (it) => {
  it('/v2/43114/quack/tvl', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/tvl');

    assert.is(statusCode, 200);
    assert.match(data, /^[.?\d]+/);
    assert.is(headers['cache-control'], 'public,s-maxage=300');
  });

  it('/v2/43114/quack/total-volume', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/total-volume');

    assert.is(statusCode, 200);
    assert.match(data, /^[.?\d]+/);
    assert.is(headers['cache-control'], 'public,s-maxage=300');
  });

  it('/v2/43114/quack/total-supply', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/total-supply');

    assert.is(statusCode, 200);
    assert.is(data, '230000000000000000000000000');
    assert.is(headers['cache-control'], 'public,s-maxage=31536000,immutable');
  });

  it('/v2/43114/quack/total-supply-whole', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/total-supply-whole');

    assert.is(statusCode, 200);
    assert.is(data, '230000000');
    assert.is(headers['cache-control'], 'public,s-maxage=31536000,immutable');
  });

  it('/v2/43114/quack/circulating-supply', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/circulating-supply');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=86400');
  });

  it('/v2/43114/quack/circulating-supply-whole', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/circulating-supply-whole');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=86400');
  });

  it('/v2/43114/quack/community-treasury', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/community-treasury');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=3600');
  });

  it('/v2/43114/quack/community-treasury-whole', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quack/community-treasury-whole');

    assert.is(statusCode, 200);
    assert.match(data, /^\d+/);
    assert.is(headers['cache-control'], 'public,s-maxage=3600');
  });
});

describe('/quackswap', (it) => {
  // Timeout issues
  // it('/quackswap/addresses', async () => {
  //   const {statusCode, data, headers} = await get('/quackswap/addresses', {
  //     timeout: 60_000,
  //   });
  //
  //   assert.is(statusCode, 200);
  //   assert.match(data, /^[.?\d]+/);
  //   assert.is(headers['cache-control'], 'public,s-maxage=86400');
  // });

  it('/quackswap/transaction-average', async () => {
    const {statusCode, data, headers} = await get('/quackswap/transaction-average');

    assert.is(statusCode, 200);
    assert.match(data, /^[.?\d]+/);
    assert.is(headers['cache-control'], 'public,s-maxage=86400');
  });

  it(`/quackswap/apr/:address`, async () => {
    const {statusCode, data, headers} = await get(
      '/quackswap/apr/0x1f806f7c8ded893fd3cae279191ad7aa3798e928',
    );

    assert.is(statusCode, 200);
    assert.ok(data.swapFeeApr !== undefined);
    assert.ok(data.stakingApr !== undefined);
    assert.ok(data.combinedApr !== undefined);
    assert.is(headers['content-type'], 'application/json;charset=utf-8');
  });

  it(`/quackswap/apr2/:pid`, async () => {
    const {statusCode, data, headers} = await get(`/quackswap/apr2/0`);

    assert.is(statusCode, 200);
    assert.ok(data.swapFeeApr !== undefined);
    assert.ok(data.stakingApr !== undefined);
    assert.ok(data.combinedApr !== undefined);
    assert.is(headers['content-type'], 'application/json;charset=utf-8');
  });
});

describe('/v2/:chain/quackswap', (it) => {
  // Timeout issues
  // it('/v2/43114/quackswap/addresses', async () => {
  //   const {statusCode, data, headers} = await get('/v2/43114/quackswap/addresses', {
  //     timeout: 60_000,
  //   });
  //
  //   assert.is(statusCode, 200);
  //   assert.match(data, /^[.?\d]+/);
  //   assert.is(headers['cache-control'], 'public,s-maxage=86400');
  // });

  it('/v2/43114/quackswap/transaction-average', async () => {
    const {statusCode, data, headers} = await get('/v2/43114/quackswap/transaction-average');

    assert.is(statusCode, 200);
    assert.match(data, /^[.?\d]+/);
    assert.is(headers['cache-control'], 'public,s-maxage=86400');
  });

  it(`/v2/43114/quackswap/apr/:pid`, async () => {
    const {statusCode, data, headers} = await get(`/v2/43114/quackswap/apr/0`);

    assert.is(statusCode, 200);
    assert.ok(data.swapFeeApr !== undefined);
    assert.ok(data.stakingApr !== undefined);
    assert.ok(data.combinedApr !== undefined);
    assert.is(headers['content-type'], 'application/json;charset=utf-8');
  });

  it(`/v2/43114/quackswap/aprs/:pids`, async () => {
    const pids = [0, 1, 2, 3];

    const {statusCode, data, headers} = await get(`/v2/43114/quackswap/aprs/${pids.join(',')}`);

    assert.is(statusCode, 200);
    assert.equal(data.length, pids.length);

    for (let i = 0; i < pids.length; i++) {
      assert.ok(data[i].swapFeeApr !== undefined);
      assert.ok(data[i].stakingApr !== undefined);
      assert.ok(data[i].combinedApr !== undefined);
    }

    assert.is(headers['content-type'], 'application/json;charset=utf-8');
  });
});
