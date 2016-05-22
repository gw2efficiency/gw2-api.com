const mongo = require('../../helpers/mongo.js')
const scraping = require('gw2e-gw2api-scraping')

async function gemPriceHistory (job, done) {
  job.log(`Starting job`)

  let prices = await scraping.gemPriceHistory()
  prices = {
    gold_to_gem: prices.goldToGems,
    gem_to_gold: prices.gemsToGold
  }
  job.log(`Fetched the gem price history`)

  await mongo.collection('cache').updateOne(
    {id: 'gemPriceHistory'},
    {id: 'gemPriceHistory', content: prices},
    {upsert: true}
  )
  job.log(`Updated gem price history`)
  done()
}

module.exports = gemPriceHistory
