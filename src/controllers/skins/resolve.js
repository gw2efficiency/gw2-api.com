const mongo = require('../../helpers/mongo.js')

async function resolve (request, response) {
  let skinItemsCache = await mongo.collection('cache')
    .find({id: 'skinsToItems'})
    .limit(1).next()

  response.send(skinItemsCache.content)
}

module.exports = resolve
