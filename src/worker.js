const logger = require('./logger.js')

class AbstractWorker {
  constructor (api, cache) {
    this.api = api
    this.cache = cache
  }

  // Schedule a worker function to run every X seconds
  schedule (callback, seconds) {
    return setInterval(() => this.execute(callback), seconds * 1000)
  }

  // Wrap a worker function in logging / error handling and execute it
  async execute (callback) {
    let start = new Date()
    let description = this.constructor.name + ' > ' + callback.name
    logger.info('Starting task: ' + description)
    try {
      await callback.call(this)
      let ms = new Date() - start
      logger.success('Finished task: ' + description + ' [' + ms + 'ms]')
    } catch (e) {
      let ms = new Date() - start
      logger.error('Failed task: ' + description + ' [' + ms + 'ms]\n' + e.stack)
    }
  }
}

module.exports = AbstractWorker
