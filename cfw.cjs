/* eslint-disable */

/**
 * @type {import('cfw').Config}
 */
module.exports = {
  name: 'quackswap-api',
  entry: 'index.ts',
  routes: ['api.quackswap.exchange/*'],
  usage: "bundled",
  module: false,
};
