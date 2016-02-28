const logger = require('./logger.js')

async function execute (callback) {
  let description = callback.name
  logger.info('Started task: ' + description)
  let start = new Date()
  try {
    await callback()
    let ms = new Date() - start
    logger.success('Finished task: ' + description + ' [' + ms + 'ms]')
  } catch (e) {
    let ms = new Date() - start
    logger.error('Failed task: ' + description + ' [' + ms + 'ms]\n' + e.stack)
  }
}

function schedule (callback, seconds) {
  setInterval(() => execute(callback), seconds * 1000)
}

module.exports = {execute, schedule}
