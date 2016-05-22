const mongo = require('../../helpers/mongo.js')
const async = require('gw2e-async-promises')
const recipeCalculation = require('gw2e-recipe-calculation')
const legendaries = require('../../static/legendaries.js')
const precursors = require('../../static/precursors.js')
const config = require('../../config/application.js')

async function craftingPrices (job, done) {
  job.log(`Starting job`)

  let recipes = await mongo.collection('recipe-trees').find().toArray()
  job.log(`Calculating crafting prices for ${recipes.length} recipes`)

  let prices = await getPrices()
  job.log(`Generated buy and sell prices`)

  recipes = recipes.map(recipe => craftingPrice(recipe, prices.buyPrices, prices.sellPrices))
  job.log(`Calculated recipe crafting prices`)

  let updateFunctions = recipes.map(recipe =>
    () => mongo.collection('items').updateMany({id: recipe.id}, {$set: recipe})
  )
  job.log(`Generated update functions`)

  await async.parallel(updateFunctions, config.mongo.parallelWriteLimit)
  job.log(`Updated crafting prices`)
  done()
}

async function getPrices () {
  let prices = await mongo.collection('items').find(
    {tradable: true, 'buy.price': {$gt: 0}, 'sell.price': {$gt: 0}},
    {_id: 0, id: 1, 'buy.price': 1, 'sell.price': 1}
  ).toArray()

  // Build the price maps
  let sellPrices = {}
  let buyPrices = {}
  prices.map(item => {
    buyPrices[item.id] = item.buy.price
    sellPrices[item.id] = item.sell.price
  })

  // Make sure we use vendor prices
  buyPrices = recipeCalculation.useVendorPrices(buyPrices)
  sellPrices = recipeCalculation.useVendorPrices(sellPrices)

  return {sellPrices: sellPrices, buyPrices: buyPrices}
}

// Add all the crafting prices for a single item
function craftingPrice (recipe, buyPrices, sellPrices) {
  let prices = {
    crafting: calculateCraftingPrice(recipe, buyPrices, sellPrices)
  }

  // If the item is a legendary add an additional key without precursor crafting
  if (legendaries.indexOf(recipe.id) !== -1) {
    prices.craftingWithoutPrecursors = calculateCraftingPrice(recipe, buyPrices, sellPrices, precursors)
  }

  return {id: recipe.id, ...prices}
}

// Actually calculate the crafting price for a recipe
function calculateCraftingPrice (recipe, buyPrices, sellPrices, ignoreItems = []) {
  let buyCraftPrice = recipeCalculation.cheapestTree(1, recipe, buyPrices, {}, ignoreItems).craftPrice
  let sellCraftPrice = recipeCalculation.cheapestTree(1, recipe, sellPrices, {}, ignoreItems).craftPrice
  let output = Math.ceil(recipe.output)

  // Calculate the normal crafting prices
  let prices = {
    buy: Math.round(buyCraftPrice / output),
    sell: Math.round(sellCraftPrice / output)
  }

  // Calculate the crafting price without daily cooldowns
  if (needsDailyCooldowns(recipe)) {
    ignoreItems = ignoreItems.concat(recipeCalculation.static.buyableDailyCooldowns)
    buyCraftPrice = recipeCalculation.cheapestTree(1, recipe, buyPrices, {}, ignoreItems).craftPrice
    sellCraftPrice = recipeCalculation.cheapestTree(1, recipe, sellPrices, {}, ignoreItems).craftPrice

    prices.buyNoDaily = Math.round(buyCraftPrice / output)
    prices.sellNoDaily = Math.round(sellCraftPrice / output)
  }

  return prices
}

// Check if any daily cooldowns are used in the recipe
function needsDailyCooldowns (recipe) {
  let items = recipeCalculation.recipeItems(recipe)
  items = items.filter(i => i !== recipe.id && recipeCalculation.static.dailyCooldowns.indexOf(i) !== -1)
  return items.length > 0
}

module.exports = craftingPrices
