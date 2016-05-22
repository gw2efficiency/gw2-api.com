const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const async = require('gw2e-async-promises')
const transformPrices = require('./_transformPrices.js')

async function itemPrices (job, done) {
  job.log(`Starting job`)

  let prices = await api().commerce().prices().all()
  let collection = mongo.collection('items')
  job.log(`Fetched prices for ${prices.length} tradingpost items`)

  let updateFunctions = prices.map(price => async () => {
    // Find the item matching the price, update the price based on the first match
    // and then overwrite the prices for all matches (= all languages)
    let item = await collection.find({id: price.id, tradable: true}).limit(1).next()

    if (!item) {
      return
    }

    item = transformPrices(item, price)
    await collection.updateMany({id: price.id}, {$set: item})
  })
  job.log(`Created update functions`)

  await async.parallel(updateFunctions)
  job.log(`Updated item prices`)
  done()
}

module.exports = itemPrices
