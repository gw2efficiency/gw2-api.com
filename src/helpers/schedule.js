const logger = require('../helpers/logger.js')
const scheduler = require('node-schedule')

function schedule (cronString, callback) {
  let parser = require('cron-parser')
  let interval = parser.parseExpression(cronString)
  logger.info('Scheduling ' + callback.name + ' (first call: ' + interval.next().toString() + ')')

  return scheduler.scheduleJob(cronString, () => execute(callback))
}

async function execute (callback) {
  let description = callback.name
  logger.info('Started task: ' + description)
  let start = new Date()
  try {
    await callback()
    let seconds = Math.round((new Date() - start) / 1000)
    logger.success('Finished task: ' + description + ' [' + seconds + 's]')
  } catch (e) {
    let seconds = Math.round((new Date() - start) / 1000)
    logger.error('Failed task: ' + description + ' [' + seconds + 's]\n' + e.stack)
  }
}

module.exports = schedule
