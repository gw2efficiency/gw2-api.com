const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const async = require('gw2e-async-promises')
const transformPrices = require('./_transformPrices.js')
const config = require('../../config/application.js')

async function itemPrices (job, done) {
  job.log(`Starting job`)

  let collection = mongo.collection('items')
  let prices = await api().commerce().prices().all()
  job.log(`Fetched prices for ${prices.length} tradingpost items`)

  var items = await updatePrices(prices)
  job.log(`Updated ${items.length} item prices`)

  let updateFunctions = items.map(item =>
    () => collection.updateMany({id: item.id}, {$set: item})
  )
  job.log(`Created update functions`)

  await async.parallel(updateFunctions)
  job.log(`Updated item prices`)
  done()
}

async function updatePrices (prices) {
  let collection = mongo.collection('items')

  let items = await collection.find(
    {id: {$in: prices.map(p => p.id)}, tradable: true, lang: config.server.defaultLanguage},
    {_id: 0, id: 1, buy: 1, sell: 1, vendor_price: 1, craftingWithoutPrecursors: 1, crafting: 1}
  ).toArray()

  let priceMap = {}
  prices.map(price => priceMap[price.id] = price)

  items = items.map(item => {
    return {id: item.id, ...transformPrices(item, priceMap[item.id])}
  })

  return items
}

module.exports = itemPrices
