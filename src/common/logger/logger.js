import Record from '@ppoliani/im-record'

const tryLog = (self, msg, fn) => {
  try {
    console.log(`${fn}: ${msg}`)
  }
  catch(error) {}
}

const debug = (self, msg) => tryLog(self, msg, 'debug')
const info = (self, msg) =>  tryLog(self, msg, 'info')
const warn = (self, msg) =>  tryLog(self, msg, 'warn')
const error = (self, msg) => tryLog(self, msg, 'error')

const Logger = Record({
  debug,
  info,
  warn,
  error
})

export default Logger
