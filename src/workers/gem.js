const AbstractWorker = require('../worker.js')
const logger = require('../logger.js')
const scraping = require('gw2api-scraping')

class GemWorker extends AbstractWorker {
  async initialize () {
    if (this.cache.state.gemPriceHistory === undefined) {
      await this.execute(this.loadGemPriceHistory)
    }

    this.schedule(this.loadGemPriceHistory, 15 * 60)
    logger.success('Initialized GemWorker')
  }

  async loadGemPriceHistory () {
    let prices = await scraping.gemPriceHistory()
    this.cache.state.gemPriceHistory = {
      gold_to_gem: prices.goldToGems,
      gem_to_gold: prices.gemsToGold
    }
    this.cache.write()
  }
}

module.exports = GemWorker
