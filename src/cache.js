const fs = require('fs')
const logger = require('./logger.js')
const dir = './storage/'
const filename = dir + 'cache.json'

let shared = {
  load: () => {
    try {
      fs.statSync(filename)
    } catch (e) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }

      logger.info('Skipping reading cache, file doesn\'t exist')
      return
    }

    try {
      let content = fs.readFileSync(filename, 'utf-8')
      shared.state = JSON.parse(content)
      logger.success('Imported cache from file')
    } catch (e) {
      logger.error('Error importing cache from file: ' + e.stack)
    }
  },
  save: () => {
    fs.writeFile(filename, JSON.stringify(shared.state), () => {
      logger.success('Saved cache to file')
    })
  },
  state: {}
}

module.exports = shared
