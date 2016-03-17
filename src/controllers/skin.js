const mongo = require('../helpers/mongo.js')

async function resolve (request, response) {
  let skinCache = await mongo.collection('cache').find({id: 'skinsToItems'}).limit(1).next()
  response.send(skinCache.content)
}

module.exports = {resolve}
