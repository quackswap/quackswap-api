# QuackSwap API

API for querying key values for QuackSwap and the QUACK token

## Development

[Wrangler](https://developers.cloudflare.com/workers/cli-wrangler) is used for a local development server. This is effectively a proxy-service that (nearly) replicates the Cloudflare Worker runtime.

Anyone can develop this repository locally. Fill in `account_id` in the `wrangler.toml` file. This value may (and should) be your own personal `account_id`.

## Location

The API is available at `https://api.quackswap.exchange`

## Methods

All methods accept a GET request.

### QuackSwap TVL

Get the total value locked in QuackSwap in USD.

Endpoint: `/quack/tvl`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/tvl'`

### QuackSwap Volume

Get the total lifetime volume of swaps on QuackSwap in USD.

Endpoint: `/quack/total-volume`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/total-volume'`

### QUACK Total Supply

Get the total lifetime supply of QUACK. QUACK is a hard-capped asset and this value will never increase.

#### 18 Decimal Denomination

The QUACK token has 18 decimals. Query the total supply denominated in units of "wei." With this method, a result of 1 QUACK would return the value `1000000000000000000`.

Endpoint: `/quack/total-supply`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/total-supply'`

#### Whole Token Denomination

The QUACK token has 18 decimals. Query the total supply denominated in units of whole QUACK. With this method, a result of 1 QUACK would return the value `1`.

Endpoint: `/quack/total-supply-whole`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/total-supply-whole'`

### QUACK Circulating Supply

Get the current circulating supply of QUACK. This value is calculated to be the total supply of QUACK minus the locked, unvested QUACK and also excludes the locked QuackSwap community treasury.

#### 18 Decimal Denomination

The QUACK token has 18 decimals. Query the circulating supply denominated in units of "wei." With this method, a result of 1 QUACK would return the value `1000000000000000000`.

Endpoint: `/quack/circulating-supply`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/circulating-supply'`

#### Whole Token Denomination

The QUACK token has 18 decimals. Query the circulating supply denominated in units of whole QUACK. With this method, a result of 1 QUACK would return the value `1`.

Endpoint: `/quack/circulating-supply-whole`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/circulating-supply-whole'`

### QuackSwap Community Treasury Supply

Get the current QUACK supply of the QuackSwap Community Treasury.

#### 18 Decimal Denomination

The QUACK token has 18 decimals. Query the balance denominated in units of "wei." With this method, a result of 1 QUACK would return the value `1000000000000000000`.

Endpoint: `/quack/community-treasury`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/community-treasury'`

#### Whole Token Denomination

The QUACK token has 18 decimals. Query the circulating supply denominated in units of whole QUACK. With this method, a result of 1 QUACK would return the value `1`.

Endpoint: `/quack/community-treasury-whole`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quack/community-treasury-whole'`

### QuackSwap Number of Address

Get the total lifetime number of unique address to transact on QuackSwap.

Endpoint: `/quackswap/addresses`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quackswap/addresses'`

### QuackSwap Average Swap Size

Get the average size of each swap on QuackSwap in USD.

Endpoint: `/quackswap/transaction-average`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quackswap/transaction-average'`

### QuackSwap Median Swap Size

Get the median size of each swap on QuackSwap in USD.

Endpoint: `/quackswap/transaction-median`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quackswap/transaction-median'`

### QuackSwap Average Percentage Reward Rate

Get the QUACK Reward Rate of the inputted StakingRewards contract address.
Refer to [Snowtrace](https://snowtrace.io/address/0x1f806f7C8dED893fd3caE279191ad7Aa3798E928#readContract) to find pIDs(pool ids).

Endpoint: `/quackswap/apr2/{pID}`

Example call: `curl --location --request GET 'https://api.quackswap.exchange/quackswap/apr2/1'`
