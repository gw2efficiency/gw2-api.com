const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const async = require('gw2e-async-promises')
const recipeNesting = require('gw2e-recipe-nesting')
const customRecipes = require('./_customRecipes.js')
const config = require('../../config/application.js')

async function loadRecipeList (job, done) {
  job.log(`Starting job`)

  // Download the official decorations as a map of upgrade_id to item_id
  let decorations = await getGuildIngredients()
  job.log(`Fetched ${Object.keys(decorations).length} guild ingredients`)

  // Download the official recipes and attach the custom one's
  let recipes = await api().recipes().all()
  recipes = recipes.concat(await customRecipes())
  job.log(`Fetched ${recipes.length} recipes`)

  // Filter the recipes so we don't work with duplicates
  let recipeIds = recipes.map(r => r.output_item_id)
  recipes = recipes.filter((value, index, self) => recipeIds.indexOf(value.output_item_id) === index)
  job.log(`Filtered ${recipes.length} unique recipes`)

  // Convert the recipes into trees
  recipes = recipeNesting(recipes, decorations)
  job.log(`Nested all recipe trees`)

  // Create and execute the recipe updates
  let collection = mongo.collection('recipe-trees')
  let updateFunctions = []
  recipes.map(recipe => updateFunctions.push(() => collection.updateOne({id: recipe.id}, recipe, {upsert: true})))
  job.log(`Generated update functions`)

  await async.parallel(updateFunctions, config.mongo.parallelWriteLimit)
  job.log(`Updated recipe trees`)

  // Update the craftable flag for items
  let itemCollection = mongo.collection('items')
  let craftableIds = recipes.map(r => r.id)
  await itemCollection.updateMany({id: {$nin: craftableIds}}, {$set: {craftable: false}})
  await itemCollection.updateMany({id: {$in: craftableIds}}, {$set: {craftable: true}})
  job.log(`Updated item "craftable" attribute`)
  done()
}

async function getGuildIngredients () {
  let upgrades = await api().guild().upgrades().all()
  let decorationsMap = {}

  upgrades
    .filter(u => u.type === 'Decoration')
    .filter(u => u.costs.length === 1)
    .filter(u => u.costs[0].type === 'Item')
    .map(u => decorationsMap[u.id] = u.costs[0].item_id)

  return decorationsMap
}

module.exports = loadRecipeList
