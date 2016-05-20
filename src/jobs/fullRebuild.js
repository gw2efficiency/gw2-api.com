const mongo = require('../helpers/mongo.js')
const itemList = require('./items/itemList.js')
const itemPrices = require('./items/itemPrices.js')
const itemValues = require('./items/itemValues.js')
const lastKnownSellPrices = require('./items/lastKnownPrices.js')
const recipeList = require('./recipes/recipeList.js')
const craftingPrices = require('./recipes/craftingPrices.js')
const skinList = require('./skins/skinList.js')
const skinPrices = require('./skins/skinPrices.js')
const gemPriceHistory = require('./gems/gemPriceHistory.js')

const doneMock = () => false

async function fullRebuild (job, done) {
  await mongo.dropDatabase()
  job.log('>> Dropped database')

  setupDatabaseCollections()
  job.log('>> Setup database collections & indexes')

  await itemList(job, doneMock)
  job.log('>> Loaded items')

  await itemPrices(job, doneMock)
  job.log('>> Loaded item prices')

  await recipeList(job, doneMock)
  job.log('>> Loaded recipes')

  await craftingPrices(job, doneMock)
  job.log('>> Calculated crafting prices')

  await lastKnownSellPrices(job, doneMock)
  job.log('>> Loaded missing last known sell prices')

  await itemValues(job, doneMock)
  job.log('>> Calculated item values')

  await skinList(job, doneMock)
  job.log('>> Loaded skin list')

  await skinPrices(job, doneMock)
  job.log('>> Calculated skin prices')

  await gemPriceHistory(job, doneMock)
  job.log('>> Loaded gem price history')

  job.log('>> Full rebuild done')
  done()
}

function setupDatabaseCollections () {
  let recipesCollection = mongo.collection('recipe-trees')
  recipesCollection.createIndex('id')

  let skinCollection = mongo.collection('cache')
  skinCollection.createIndex('id')

  let collection = mongo.collection('items')
  collection.createIndex('id')
  collection.createIndex('lang')
}

module.exports = fullRebuild
