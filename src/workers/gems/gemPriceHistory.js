const mongo = require('../../helpers/mongo.js')
const scraping = require('gw2e-gw2api-scraping')

async function gemPriceHistory () {
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

module.exports = gemPriceHistory
