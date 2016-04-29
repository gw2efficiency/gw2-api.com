require('babel-polyfill')
const mongo = require('../helpers/mongo.js')
const chalk = require('chalk')
const rebuild = require('../helpers/rebuild.js')

function log (string, error = false) {
  let formatting = error ? chalk.red.bold : chalk.green.bold
  console.log(formatting('---> ' + string))
}

// Connect to the DB and get working! :)
mongo.connect().then(() => {
  let mode = process.argv[2] || 'full'

  if (['full', 'items', 'recipes', 'skins', 'gems'].indexOf(mode) === -1) {
    log('Mode is not valid', true)
    process.exit()
    return
  }

  // Wait 5 seconds so in case of a full rebuild the user
  // has the ability to abort the database being dumped
  setTimeout(async () => {
    try {
      log('Mode: ' + mode + ' rebuild')
      await rebuild(mode, log)
      log('Completed!')
      process.exit()
    } catch (e) {
      log('Error happened while rebuilding:\n' + e.stack, true)
      process.exit(1)
    }
  }, 5000)
})
