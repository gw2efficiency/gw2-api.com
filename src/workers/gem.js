const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const scraping = require('gw2e-gw2api-scraping')

async function initialize () {
  let collection = mongo.collection('cache')
  collection.createIndex('id')
  let exists = !!(await collection.find({id: 'gemPriceHistory'}).limit(1).next())

  if (!exists) {
    await execute(loadGemPriceHistory)
  }

  // Update the gem history every 30 mins since we
  // have no idea how long this is cached for :(
  schedule('30/* * * * *', loadGemPriceHistory)

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
