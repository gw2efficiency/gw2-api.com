require('babel-polyfill')
const mongo = require('../helpers/mongo.js')
const logger = require('../helpers/logger.js')
const rebuild = require('../helpers/rebuild.js')
const exit = require('exit')

// Connect to the DB and get working! :)
mongo.connect().then(() => {
  let mode = process.argv[2] || 'full'

  // Check if the rebuild mode is valid
  if (['full', 'items', 'recipes', 'skins', 'gems'].indexOf(mode) === -1) {
    logger.error('Mode is not valid', true)
    return exit()
  }

  logger.success('Mode: ' + mode + ' rebuild (starting in 5 seconds)')

  // Wait 5 seconds so in case of a full rebuild the user
  // has the ability to abort the database being dumped
  setTimeout(async () => {
    try {
      await rebuild(mode, logger.success)
      logger.success('Completed!')
      exit()
    } catch (e) {
      logger.error('Error happened while rebuilding:\n' + e.stack, true)
      exit(1)
    }
  }, 5000)
})
