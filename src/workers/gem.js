const logger = require('../helpers/logger.js')
const storage = require('../helpers/sharedStorage.js')
const {execute, schedule} = require('../helpers/workers.js')
const scraping = require('gw2e-gw2api-scraping')

async function initialize () {
  if (storage.get('gemPriceHistory') === undefined) {
    await execute(loadGemPriceHistory)
  }

  schedule(loadGemPriceHistory, 15 * 60)
  logger.info('Initialized gem worker')
}

async function loadGemPriceHistory () {
  let prices = await scraping.gemPriceHistory()
  storage.set('gemPriceHistory', {
    gold_to_gem: prices.goldToGems,
    gem_to_gold: prices.gemsToGold
  })
  storage.save()
}

module.exports = {initialize, loadGemPriceHistory}
