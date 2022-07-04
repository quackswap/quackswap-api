import * as QUERIES from './queries';

export async function getTokenPriceETH(url: string | undefined, address: string): Promise<string> {
  console.log("🚀 ~ file: gql.ts ~ line 4 ~ getTokenPriceETH ~ address", address)
  const response = await request(QUERIES.TOKEN_PRICE, url, {
    address: address.toLowerCase(),
  });
  console.log("🚀 ~ file: gql.ts ~ line 7 ~ getTokenPriceETH ~ response", response.toString());
  return response.token.derivedETH;
}

export async function getPairPriceUSD(url: string | undefined, address: string): Promise<string> {
  const response = await request(QUERIES.PAIR_VALUE, url, {
    address: address.toLowerCase(),
  });
  return response.pair.reserveUSD;
}

export async function getETHPrice(url: string | undefined): Promise<string> {
  const response = await request(QUERIES.BTT_PRICE, url);
  return response.bundle.ethPrice;
}

export async function request(query: string, url: string | undefined, variables = {}) {
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
