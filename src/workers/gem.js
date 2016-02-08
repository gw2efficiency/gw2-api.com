const AbstractWorker = require('../worker.js')
const scraping = require('gw2api-scraping')

class GemWorker extends AbstractWorker {
  async initialize () {
    await this.execute(this.loadGemPriceHistory)
    this.schedule(this.loadGemPriceHistory, 30 * 60)
    this.logSuccess('Initialized GemWorker')
  }

  async loadGemPriceHistory () {
    let prices = await scraping.gemPriceHistory()
    this.cache.gemPriceHistory = {
      gold_to_gem: prices.goldToGems,
      gem_to_gold: prices.gemsToGold
    }
  }
}

module.exports = (api, cache) => new GemWorker(api, cache)
