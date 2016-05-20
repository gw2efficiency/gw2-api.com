const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const async = require('gw2e-async-promises')
const recipeNesting = require('gw2e-recipe-nesting')
const customRecipes = require('./_customRecipes.js')

async function loadRecipeList (job, done) {
  job.log(`Starting job`)

  // Download the official recipes and attach the custom one's
  let recipes = await api().recipes().all()
  recipes = recipes.concat(await customRecipes())
  job.log(`Fetched ${recipes.length} recipes`)

  // Filter the recipes so we don't work with duplicates
  let recipeIds = recipes.map(r => r.output_item_id)
  recipes = recipes.filter((value, index, self) => recipeIds.indexOf(value.output_item_id) === index)

  // Convert the recipes into trees
  recipes = recipeNesting(recipes)
  job.log(`Nested all recipe trees`)

  // Create and execute the recipe updates
  let collection = mongo.collection('recipe-trees')
  let updateFunctions = []
  recipes.map(recipe => updateFunctions.push(() => collection.update({id: recipe.id}, recipe, {upsert: true})))
  job.log(`Generated update functions`)

  await async.parallel(updateFunctions)
  job.log(`Updated recipe trees`)

  // Update the craftable flag for items
  let itemCollection = mongo.collection('items')
  let craftableIds = recipes.map(r => r.id)
  await itemCollection.update({id: {$nin: craftableIds}}, {$set: {craftable: false}}, {multi: true})
  await itemCollection.update({id: {$in: craftableIds}}, {$set: {craftable: true}}, {multi: true})
  job.log(`Updated item "craftable" attribute`)
  done()
}

module.exports = loadRecipeList
