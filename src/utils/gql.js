import * as QUERIES from './queries.js';
import fetch from 'node-fetch';

export async function request(query, url, variables = {}) {
  if (url === undefined) {
    throw new Error(`Missing subgraph url`);
  }

  const _ = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (_.status !== 200) {
    const message = `[${_.statusText}]: Error querying ${query}`;
    console.error(message);
    throw new Error(message);
  }

  const {data} = await _.json();

  return data;
}

export async function getTokenPriceETH(url, address) {
  const response = await request(QUERIES.TOKEN_PRICE, url, {
    address: address.toLowerCase(),
  });
  return response.token.derivedETH;
}

export async function getPairPriceUSD(url, address) {
  const response = await request(QUERIES.PAIR_VALUE, url, {
    address: address.toLowerCase(),
  });
  return response.pair.reserveUSD;
}

export async function getETHPrice(url) {
  const response = await request(QUERIES.BTT_PRICE, url);
  return response.bundle.ethPrice;
}
