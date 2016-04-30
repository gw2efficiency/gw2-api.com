// This file defines all background jobs that
// are scheduled using the standard cronjob format

const schedule = [
  ['0 0 2 * * *', require('../workers/items/itemList.js')],
  ['*/5 * * * *', require('../workers/items/itemPrices.js')],
  ['*/5 * * * *', require('../workers/items/itemValues.js')],
  ['0 0 4 * * *', require('../workers/recipes/recipeList.js')],
  ['*/5 * * * *', require('../workers/recipes/craftingPrices.js')],
  ['0 0 3 * * *', require('../workers/skins/skinList.js')],
  ['*/5 * * * *', require('../workers/skins/skinPrices.js')],
  ['30/* * * * *', require('../workers/gems/gemPriceHistory.js')]
]

module.exports = schedule
