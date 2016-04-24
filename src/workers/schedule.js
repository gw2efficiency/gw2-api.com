const {schedule} = require('./scheduleHelper.js')
const itemList = require('./items/itemList.js')
const itemPrices = require('./items/itemPrices.js')
const itemValues = require('./items/itemValues.js')
const recipeList = require('./recipes/recipeList.js')
const craftingPrices = require('./recipes/craftingPrices.js')
const skinList = require('./skins/skinList.js')
const skinPrices = require('./skins/skinPrices.js')
const gemPriceHistory = require('./gems/gemPriceHistory.js')

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
