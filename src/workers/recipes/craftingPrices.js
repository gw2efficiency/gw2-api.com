const mongo = require('../../helpers/mongo.js')
const async = require('gw2e-async-promises')
const recipeCalculation = require('gw2e-recipe-calculation')

const legendaries = [30684, 30685, 30686, 30687, 30688, 30689, 30690, 30691, 30692, 30693, 30694, 30695, 30696, 30697, 30698, 30699, 30700, 30701, 30702, 30703, 30704, 71383, 72713, 76158]
const precursors = [29166, 29167, 29168, 29169, 29170, 29171, 29172, 29173, 29174, 29175, 29176, 29177, 29178, 29179, 29180, 29181, 29182, 29183, 29184, 29185]

async function craftingPrices () {
  let recipes = await mongo.collection('recipe-trees').find().toArray()
  let prices = await mongo.collection('items').find(
    {tradable: true, 'buy.price': {'$gt': 0}, 'sell.price': {'$gt': 0}},
    {_id: 0, id: 1, 'buy.price': 1, 'sell.price': 1}
  ).toArray()

  // Build the price arrays
  let sellPrices = {}
  let buyPrices = {}
  prices.map(item => {
    buyPrices[item.id] = item.buy.price
    sellPrices[item.id] = item.sell.price
  })
  buyPrices = recipeCalculation.useVendorPrices(buyPrices)
  sellPrices = recipeCalculation.useVendorPrices(sellPrices)

  // Go through the recipes and update the items with
  // the cheapest crafting price
  let updateFunctions = recipes.map(recipe =>
    () => craftingPrice(recipe, buyPrices, sellPrices)
  )

  await async.parallel(updateFunctions)
}

// Add all the crafting prices for a single item
async function craftingPrice (recipe, buyPrices, sellPrices) {
  var item = {
    crafting: calculateCraftingPrice(recipe, buyPrices, sellPrices)
  }

  // If the item is a legendary add an additional
  // crafting object without precursor crafting
  if (legendaries.indexOf(recipe.id) !== -1) {
    item.craftingWithoutPrecursors = calculateCraftingPrice(recipe, buyPrices, sellPrices, precursors)
  }

  await mongo.collection('items').update({id: recipe.id}, {'$set': item}, {multi: true})
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

// Check if any daily cooldown is used in the recipe
function needsDailyCooldowns (recipe) {
  let items = recipeCalculation.recipeItems(recipe)
  items = items.filter(i => i !== recipe.id && recipeCalculation.static.dailyCooldowns.indexOf(i) !== -1)
  return items.length > 0
}

module.exports = craftingPrices
