const storage = require('../helpers/sharedStorage.js')

function resolve (request, response) {
  response.send(storage.get('skinsToItems'))
}

module.exports = {resolve}
