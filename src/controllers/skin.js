const mongo = require('../helpers/mongo.js')

async function resolve (request, response) {
  let skinItemsCache = await mongo.collection('cache').find({id: 'skinsToItems'}).limit(1).next()
  response.send(skinItemsCache.content)
}

async function prices (request, response) {
  let skinPricesCache = await mongo.collection('cache').find({id: 'skinPrices'}).limit(1).next()
  response.send(skinPricesCache.content)
}

module.exports = {resolve, prices}
