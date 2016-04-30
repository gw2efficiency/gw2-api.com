require('babel-polyfill')
const mongo = require('../helpers/mongo.js')
const chalk = require('chalk')
const rebuild = require('../helpers/rebuild.js')

let lastLog = new Date()
function log (string, error = false) {
  let timeDifference = Math.round((new Date() - lastLog) / 1000)
  lastLog = new Date()
  let formatting = error ? chalk.red.bold : chalk.green.bold

  console.log(formatting('---> ' + string + ' +' + timeDifference + 's'))
}

// Connect to the DB and get working! :)
mongo.connect().then(() => {
  let mode = process.argv[2] || 'full'

  // Check if the rebuild mode is valid
  if (['full', 'items', 'recipes', 'skins', 'gems'].indexOf(mode) === -1) {
    log('Mode is not valid', true)
    process.exit()
    return
  }

  log('Mode: ' + mode + ' rebuild (starting in 5 seconds)')

  // Wait 5 seconds so in case of a full rebuild the user
  // has the ability to abort the database being dumped
  setTimeout(async () => {
    try {
      await rebuild(mode, log)
      log('Completed!')
      process.exit()
    } catch (e) {
      log('Error happened while rebuilding:\n' + e.stack, true)
      process.exit(1)
    }
  }, 5000)
})
