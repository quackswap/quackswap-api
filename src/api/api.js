import {createBasicResponse, throwWithError} from '../utils/api.js'
// import logger from '../../common/logger.js'

export const getVersion = async ctx => {
  try {
    createBasicResponse(ctx, {version: process.env.npm_package_version})
  }
  catch(error) {
    // logger.error(`Error : ${error.message}`)
    throwWithError(ctx, 'Internal Server Error')
  }
}
