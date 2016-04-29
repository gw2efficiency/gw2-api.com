const mongo = require('../../helpers/mongo.js')

async function history (request, response) {
  let historyCache = await mongo.collection('cache')
    .find({id: 'gemPriceHistory'})
    .limit(1).next()

  response.send(historyCache.content)
}

module.exports = history
