require('babel-polyfill')
const kue = require('kue')
const queue = kue.createQueue()
const mongo = require('../helpers/mongo.js')
const wrapJob = require('../helpers/wrapJob.js')

mongo.connect().then(() => {
  queue.process('item-list', wrapJob(require('../jobs/items/itemList.js')))
  queue.process('item-prices', wrapJob(require('../jobs/items/itemPrices.js')))
  queue.process('item-values', wrapJob(require('../jobs/items/itemValues.js')))
  queue.process('item-last-known-prices', wrapJob(require('../jobs/items/lastKnownPrices.js')))

  queue.process('skin-list', wrapJob(require('../jobs/skins/skinList.js')))
  queue.process('skin-prices', wrapJob(require('../jobs/skins/skinPrices.js')))

  queue.process('recipe-list', wrapJob(require('../jobs/recipes/recipeList.js')))
  queue.process('crafting-prices', wrapJob(require('../jobs/recipes/craftingPrices.js')))

  queue.process('gem-price-history', wrapJob(require('../jobs/gems/gemPriceHistory.js')))
})
