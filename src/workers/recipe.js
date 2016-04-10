const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')
const requester = require('gw2e-requester')
const async = require('gw2e-async-promises')
const recipeNesting = require('gw2e-recipe-nesting')

async function initialize () {
  let recipesCollection = mongo.collection('recipe-trees')
  recipesCollection.createIndex('id')
  let recipeExists = !!(await recipesCollection.find({}).limit(1).next())

  let itemCollection = mongo.collection('items')
  let itemExists = !!(await itemCollection.find({}).limit(1).next())

  if (itemExists && !recipeExists) {
    await execute(loadRecipeList)
  }

  // Update the recipes every day at 4
  schedule('0 0 4 * * *', loadRecipeList)

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

module.exports = {initialize, loadRecipeList}
