const mongo = require('../helpers/mongo.js')
const itemList = require('../workers/items/itemList.js')
const itemPrices = require('../workers/items/itemPrices.js')
const itemValues = require('../workers/items/itemValues.js')
const lastKnownSellPrices = require('../workers/items/lastKnownSellPrices.js')
const recipeList = require('../workers/recipes/recipeList.js')
const craftingPrices = require('../workers/recipes/craftingPrices.js')
const skinList = require('../workers/skins/skinList.js')
const skinPrices = require('../workers/skins/skinPrices.js')
const gemPriceHistory = require('../workers/gems/gemPriceHistory.js')

function setupDatabaseCollections () {
  let recipesCollection = mongo.collection('recipe-trees')
  recipesCollection.createIndex('id')

  let skinCollection = mongo.collection('cache')
  skinCollection.createIndex('id')

  let collection = mongo.collection('items')
  collection.createIndex('id')
  collection.createIndex('lang')
}

async function rebuild (type, log) {
  if (type === 'full') {
    await mongo.dropDatabase()
    log('Dropped database')

    setupDatabaseCollections()
    log('Setup database collections & indexes')
  }

  if (type === 'full' || type === 'items') {
    await itemList()
    log('Loaded items')

    await itemPrices()
    log('Loaded item prices')
  }

  if (type === 'full' || type === 'recipes') {
    await recipeList()
    log('Loaded recipes')

    await craftingPrices()
    log('Calculated crafting prices')
  }

  if (type === 'full' || type === 'items') {
    await lastKnownSellPrices()
    log('Loaded missing last known sell prices')
  }

  if (type === 'full' || type === 'items' || type === 'recipes') {
    await itemValues()
    log('Calculated item values')
  }

  if (type === 'full' || type === 'skins') {
    await skinList()
    log('Loaded skin list')

    await skinPrices()
    log('Calculated skin prices')
  }

  if (type === 'full' || type === 'gems') {
    await gemPriceHistory()
    log('Loaded gem price history')
  }
}

module.exports = rebuild
