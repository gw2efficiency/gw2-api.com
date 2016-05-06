const requester = require('gw2e-requester')

// These are the recipes that are blacklisted. These are usually circular dependencies,
// but also include some recipes that are not really done and distort the value of items
const outputBlacklist = [
  38014, 36060, 36061, 38115, 38116, 38117, 38118, 38119,
  39120, 39121, 39122, 39123, 39124, 39125, 39126, 39127,
  41886, 47909, 37070
]

async function customRecipes () {
  let recipes = await requester.single('https://raw.githubusercontent.com/queicherius/gw2-mystic-forge-recipes/master/recipes.json')

  // Remove the currency items (tokens etc) from the ingredients,
  // since we can't make any use of them at the moment
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
    let ingredientIds = recipe.ingredients.map(i => i.item_id)
    if (ingredientIds.indexOf(recipe.output_item_id) !== -1) {
      return false
    }

    // Remove demotions (fractal globs and vials)
    if (recipe.output_item_id === 38023 && ingredientIds.indexOf(38024) !== -1) {
      return false
    }

    // Remove blacklisted items (usually circular dependencies)
    if (outputBlacklist.indexOf(recipe.output_item_id) !== -1) {
      return false
    }

    return true
  })

  return recipes
}

module.exports = customRecipes
