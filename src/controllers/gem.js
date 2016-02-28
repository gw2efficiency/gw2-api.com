const storage = require('../helpers/sharedStorage.js')

function history (request, response) {
  response.send(storage.get('gemPriceHistory'))
}

module.exports = {history}
