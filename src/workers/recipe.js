const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')
const requester = require('gw2e-requester')
const async = require('gw2e-async-promises')
const recipeNesting = require('gw2e-recipe-nesting')
const recipeCalculation = require('gw2e-recipe-calculation')

const legendaries = [30684, 30685, 30686, 30687, 30688, 30689, 30690, 30691, 30692, 30693, 30694, 30695, 30696, 30697, 30698, 30699, 30700, 30701, 30702, 30703, 30704, 71383, 72713, 76158]
const precursors = [29166, 29167, 29168, 29169, 29170, 29171, 29172, 29173, 29174, 29175, 29176, 29177, 29178, 29179, 29180, 29181, 29182, 29183, 29184, 29185]

async function initialize () {
  let recipesCollection = mongo.collection('recipe-trees')
  recipesCollection.createIndex('id')
  let recipeExists = !!(await recipesCollection.find({}).limit(1).next())

  let itemCollection = mongo.collection('items')
  let itemExists = !!(await itemCollection.find({}).limit(1).next())

  if (itemExists && !recipeExists) {
    await execute(loadRecipeList)
    await execute(updateCraftingPrices)
  }

  // Update the recipes every day at 4
  schedule('0 0 4 * * *', loadRecipeList)

  // Update the crafting prices every 5 minutes
  schedule('*/5 * * * *', updateCraftingPrices)

  logger.info('Initialized recipe worker')
}

async function loadRecipeList () {
  // Download the official recipes and attach the custom one's
  let recipes = await api().recipes().all()
  recipes = recipes.concat(await loadCustomRecipes())

  // Filter the recipes so we don't work with duplicates
  let recipeIds = recipes.map(r => r.output_item_id)
  recipes = recipes.filter((value, index, self) => recipeIds.indexOf(value.output_item_id) === index)

  // Convert the recipes into trees
  recipes = recipeNesting(recipes)

  // Create and execute the recipe updates
  let collection = mongo.collection('recipe-trees')
  let updateFunctions = []
  recipes.map(recipe => updateFunctions.push(() => collection.update({id: recipe.id}, recipe, {upsert: true})))

  await async.parallel(updateFunctions)

  // Update the craftable flag for items
  let itemCollection = mongo.collection('items')
  let craftableIds = recipes.map(r => r.id)
  await itemCollection.update({id: {'$nin': craftableIds}}, {'$set': {craftable: false}}, {multi: true})
  await itemCollection.update({id: {'$in': craftableIds}}, {'$set': {craftable: true}}, {multi: true})
}

function updateCraftingPrices () {
  return new Promise(async resolve => {
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
    let collection = mongo.collection('items')
    let updateFunctions = recipes.map(recipe => () =>
      new Promise(async resolve => {
        var item = {
          crafting: calculateCraftingPrice(recipe, buyPrices, sellPrices)
        }

        // If the item is a legendary add an additional
        // crafting object without precursor crafting
        if (legendaries.indexOf(recipe.id) !== -1) {
          item.craftingWithoutPrecursors = calculateCraftingPrice(recipe, buyPrices, sellPrices, precursors)
        }

        await collection.update({id: recipe.id}, {'$set': item}, {multi: true})
        resolve()
      })
    )

    await async.parallel(updateFunctions)
    resolve()
  })
}

function calculateCraftingPrice (recipe, buyPrices, sellPrices, ignoreItems = []) {
  // Calculate the normal crafting prices
  let prices = {
    buy: recipeCalculation.cheapestTree(1, recipe, buyPrices, {}, ignoreItems).craftPrice,
    sell: recipeCalculation.cheapestTree(1, recipe, sellPrices, {}, ignoreItems).craftPrice
  }

  // Calculate the crafting price without daily cooldowns
  if (needsDailyCooldowns(recipe)) {
    ignoreItems = ignoreItems.concat(recipeCalculation.static.buyableDailyCooldowns)
    prices.buyNoDaily = recipeCalculation.cheapestTree(1, recipe, buyPrices, {}, ignoreItems).craftPrice
    prices.sellNoDaily = recipeCalculation.cheapestTree(1, recipe, sellPrices, {}, ignoreItems).craftPrice
  }

  return prices
}

function needsDailyCooldowns (recipe) {
  let items = recipeCalculation.recipeItems(recipe)
  items = items.filter(i => i !== recipe.id && recipeCalculation.static.dailyCooldowns.indexOf(i) !== -1)
  return items.length > 0
}

async function loadCustomRecipes () {
  let outputBlacklist = [
    38014, 36060, 36061, 38115, 38116, 38117, 38118, 38119,
    39120, 39121, 39122, 39123, 39124, 39125, 39126, 39127
  ]
  let recipes = await requester.single('https://raw.githubusercontent.com/queicherius/gw2-mystic-forge-recipes/master/recipes.json')

  // Remove the currency items (tokens etc) from the ingredients,
  // since we can't make any use of them atm
  recipes = recipes.map(recipe => {
    recipe.ingredients = recipe.ingredients.filter(i => i.item_id > 0)
    return recipe
  })

  recipes = recipes.filter(recipe => {
    // Remove currency item output
    if (recipe.output_item_id < 0) {
      return false
    }

    // Remove items with no ingredients
    if (recipe.ingredients.length === 0) {
      return false
    }

    // Remove circular dependencies (promotions)
    // Note: the nesting could handle that, but I don't want to blow up the recipe tree
    let ingredientIds = recipe.ingredients.map(i => i.item_id)
    if (ingredientIds.indexOf(recipe.output_item_id) !== -1) {
      return false
    }

    // Remove demotions (fractal globs and vials)
    if (recipe.output_item_id === 38023 && ingredientIds.indexOf(38024) !== -1) {
      return false
    }

    // Remove blacklisted items (circular dependencies)
    if (outputBlacklist.indexOf(recipe.output_item_id) !== -1) {
      return false
    }

    return true
  })

  return recipes
}

module.exports = {initialize, loadRecipeList, updateCraftingPrices}
