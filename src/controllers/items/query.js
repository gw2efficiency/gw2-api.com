const mongo = require('../../helpers/mongo.js')
const {multiParameter} = require('../../helpers/controllers.js')
const categoryMap = require('../../static/categories.js')
const escapeRegex = require('escape-string-regexp')
const config = require('../../config/application.js')

// Generate a mapping from category id => subcategories
let categoryIdMap = {}
Object.values(categoryMap).map(category => {
  categoryIdMap[category[0]] = !category[1] ? false : Object.values(category[1])
})

async function query (request, response) {
  let categories = multiParameter(request.params.categories, false, ';')
  let rarities = multiParameter(request.params.rarities, true, ';')
  let craftable = request.params.craftable
  let excludeName = request.params.exclude_name
  let includeName = request.params.include_name
  let output = request.params.output

  let mongoQuery = {lang: config.server.defaultLanguage}

  // Only get items matching the categories
  if (categories.length > 0) {
    mongoQuery['category'] = {'$in': allowedCategories(categories)}
  }

  // Only get items matching the rarities
  if (rarities.length > 0) {
    mongoQuery['rarity'] = {'$in': rarities}
  }

  // Only get craftable items
  if (craftable !== undefined) {
    mongoQuery['craftable'] = true
  }

  // Only get items where the name matches the included and excluded query
  if (includeName || excludeName) {
    mongoQuery['$and'] = nameQueries(includeName, excludeName)
  }

  // Make sure the prices are set if we output a price breakdown
  if (output === 'prices') {
    mongoQuery['buy.price'] = {$ne: null}
    mongoQuery['sell.price'] = {$ne: null}
  }

  let items = await mongo.collection('items')
    .find(mongoQuery, {_id: 0, id: 1, name: 1, 'buy.price': 1, 'sell.price': 1})
    .toArray()

  if (output !== 'prices') {
    return response.send(items.map(x => x.id))
  }

  let buyPrices = items.map(i => i.buy.price)
  let sellPrices = items.map(i => i.sell.price)
  response.send({
    buy: valueBreakdown(buyPrices),
    sell: valueBreakdown(sellPrices)
  })
}

// Generate an array with the expanded allowed categories
// so we can just do an "in" match in the database
function allowedCategories (categories) {
  let categoryList = []

  categories.map(category => {
    // Parse categories from input
    category = category.split(',').map(id => parseInt(id, 10))

    // Category already has subcategory or has no subcategories in general
    if (category[1] || !categoryIdMap[category[0]]) {
      categoryList.push(category)
      return
    }

    // Add all subcategories if only the main category is set
    categoryIdMap[category[0]].map(subcategory => {
      categoryList.push([category[0], subcategory])
    })
  })

  return categoryList
}

// Only get items where the name matches the included and excluded query
function nameQueries (includeName, excludeName) {
  let queries = []

  if (includeName !== undefined) {
    queries.push({name: {'$regex': escapeRegex(includeName), '$options': 'i'}})
  }

  if (excludeName !== undefined) {
    queries.push({name: {'$regex': `^(?:(?!${escapeRegex(excludeName)}).)*$`, '$options': 'i'}})
  }

  return queries
}

// Get min, avg and max out of a list of values
function valueBreakdown (array) {
  return {
    min: Math.min.apply(null, array),
    avg: Math.round(array.reduce((x, y) => x + y, 0) / array.length),
    max: Math.max.apply(null, array)
  }
}

module.exports = query
