require('babel-polyfill')
const mongo = require('./helpers/mongo.js')
const schedule = require('./helpers/schedule.js')
const itemList = require('./workers/items/itemList.js')
const itemPrices = require('./workers/items/itemPrices.js')
const itemValues = require('./workers/items/itemValues.js')
const recipeList = require('./workers/recipes/recipeList.js')
const craftingPrices = require('./workers/recipes/craftingPrices.js')
const skinList = require('./workers/skins/skinList.js')
const skinPrices = require('./workers/skins/skinPrices.js')
const gemPriceHistory = require('./workers/gems/gemPriceHistory.js')

// Connect to the database and start the scheduling
mongo.connect().then(() => {
  // Items
  schedule('0 0 2 * * *', itemList, 60 * 60)
  schedule('*/5 * * * *', itemPrices)
  schedule('*/5 * * * *', itemValues)

  // Recipes
  schedule('0 0 4 * * *', recipeList)
  schedule('*/5 * * * *', craftingPrices)

  // Skins
  schedule('0 0 3 * * *', skinList)
  schedule('*/5 * * * *', skinPrices)

  // Gems
  schedule('30/* * * * *', gemPriceHistory)
})
