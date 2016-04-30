const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const async = require('gw2e-async-promises')
const transformPrices = require('./_transformPrices.js')

async function itemPrices () {
  let prices = await api().commerce().prices().all()
  let collection = mongo.collection('items')

  let updateFunctions = prices.map(price => async () => {
    // Find the item matching the price, update the price based on the first match
    // and then overwrite the prices for all matches (= all languages)
    let item = await collection.find({id: price.id, tradable: true}).limit(1).next()

    if (!item) {
      return
    }

    item = transformPrices(item, price)
    await collection.update({id: price.id}, {'$set': item}, {multi: true})
  })

  await async.parallel(updateFunctions)
}

module.exports = itemPrices
