const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const scraping = require('gw2e-gw2api-scraping')

async function initialize () {
  let collection = mongo.collection('cache')
  collection.createIndex('id')
  let exists = !!await collection.find({id: 'gemPriceHistory'}).limit(1).next()

  if (!exists) {
    await execute(loadGemPriceHistory)
  }

  schedule(loadGemPriceHistory, 15 * 60)
  logger.info('Initialized gem worker')
}

async function loadGemPriceHistory () {
  let prices = await scraping.gemPriceHistory()
  prices = {
    gold_to_gem: prices.goldToGems,
    gem_to_gold: prices.gemsToGold
  }

  await mongo.collection('cache').update(
    {id: 'gemPriceHistory'},
    {id: 'gemPriceHistory', content: prices},
    {upsert: true}
  )
}

module.exports = {initialize, loadGemPriceHistory}
