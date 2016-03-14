const logger = require('../helpers/logger.js')
const storage = require('../helpers/sharedStorage.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')
const requester = require('gw2e-requester')
const recipeNesting = require('gw2e-recipe-nesting')

async function initialize () {
  if (storage.get('recipeTrees') === undefined) {
    await execute(loadRecipeList)
  }

  schedule(loadRecipeList, 15 * 60)
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
  storage.set('recipeTrees', recipes)
  storage.save()
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

    // Remove circular dependencies
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
