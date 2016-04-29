require('babel-polyfill')
const mongo = require('./helpers/mongo.js')
const chalk = require('chalk')
const itemList = require('./workers/items/itemList.js')
const itemPrices = require('./workers/items/itemPrices.js')
const itemValues = require('./workers/items/itemValues.js')
const lastKnownSellPrices = require('./workers/items/lastKnownSellPrices.js')
const recipeList = require('./workers/recipes/recipeList.js')
const craftingPrices = require('./workers/recipes/craftingPrices.js')
const skinList = require('./workers/skins/skinList.js')
const skinPrices = require('./workers/skins/skinPrices.js')
const gemPriceHistory = require('./workers/gems/gemPriceHistory.js')

function log (string, error = false) {
  let formatting = error ? chalk.red.bold : chalk.green.bold
  console.log(formatting('---> ' + string))
}

// Connect to the DB and get working! :)
mongo.connect().then(async () => {
  // Setup all the database collections
  let recipesCollection = mongo.collection('recipe-trees')
  recipesCollection.createIndex('id')

  let skinCollection = mongo.collection('cache')
  skinCollection.createIndex('id')

  let collection = mongo.collection('items')
  collection.createIndex('id')
  collection.createIndex('lang')

  try {
    await mongo.dropDatabase()
    log('Cleared database')

    await itemList()
    log('Loaded items')

    await itemPrices()
    log('Loaded item prices')

    await recipeList()
    log('Loaded recipes')

    await craftingPrices()
    log('Calculated crafting prices')

    await lastKnownSellPrices()
    log('Loaded missing last known sell prices')

    await itemValues()
    log('Calculated item values')

    await skinList()
    log('Loaded skin list')

    await skinPrices()
    log('Loaded skin list')

    await gemPriceHistory
    log('Loaded gem price history')

    log('Rebuild complete')
    process.exit()
  } catch (e) {
    log('Error happened while rebuilding:\n' + e.stack, true)
    process.exit(1)
  }
})
