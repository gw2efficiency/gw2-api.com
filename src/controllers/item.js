const mongo = require('../helpers/mongo.js')
const {invalidParameters, requestLanguage, multiParameter} = require('../helpers/controllers.js')
const categoryMap = require('../static/categories.js')
const escapeRegex = require('escape-string-regexp')
const ignoredFields = {_id: 0, lang: 0, valueIsVendor: 0}

async function byId (request, response) {
  let lang = requestLanguage(request.params)
  let id = parseInt(request.params.id, 10)

  if (!id) {
    return invalidParameters(response)
  }

  let item = await mongo.collection('items').find({id: id, lang: lang}, ignoredFields).limit(1).next()

  if (!item) {
    return response.send(404, {text: 'no such id'})
  }

  response.send(item)
}

async function byIds (request, response) {
  let lang = requestLanguage(request.params)
  let ids = multiParameter(request.params.ids, true)

  let items = await mongo.collection('items').find({id: {'$in': ids}, lang: lang}, ignoredFields).toArray()
  response.send(items)
}

async function all (request, response) {
  let lang = requestLanguage(request.params)

  let items = await mongo.collection('items').find({tradable: true, lang: lang}, ignoredFields).toArray()
  response.send(items)
}

async function allPrices (request, response) {
  let items = await mongo.collection('items').aggregate([
    {'$match': {tradable: true, lang: 'en'}},
    {'$project': {_id: 0, id: 1, price: {'$max': ['$sell.price', '$buy.price', '$vendor_price']}}},
    {'$match': {price: {'$ne': null}}}
  ]).toArray()

  response.send(items)
}

async function allValues (request, response) {
  let items = await mongo.collection('items').find(
    {lang: 'en', value: {'$ne': null}},
    {_id: 0, id: 1, value: 1}
  ).toArray()
  response.send(items)
}

function categories (request, response) {
  response.send(categoryMap)
}

async function autocomplete (request, response) {
  if (!request.params.q) {
    return invalidParameters(response)
  }

  let lang = requestLanguage(request.params)
  let query = request.params.q.toLowerCase()
  let craftable = parseInt(request.params.craftable, 10) === 1

  if (query.length < 3) {
    return response.send([])
  }

  let mongoQuery = {
    name: {'$regex': escapeRegex(query), '$options': 'i'},
    lang: lang
  }

  if (craftable) {
    mongoQuery['craftable'] = true
  }

  let items = await mongo.collection('items').find(mongoQuery, ignoredFields).toArray()

  items.sort((a, b) => {
    a = matchQuality(a.name.toLowerCase(), query)
    b = matchQuality(b.name.toLowerCase(), query)
    return a - b
  })

  response.send(items.slice(0, 20))
}

// Determine the quality of matching a query string in a target string
function matchQuality (target, query) {
  if (target === query) {
    return 0
  }

  let index = target.indexOf(query)
  return 1 + index
}

async function byName (request, response) {
  let lang = requestLanguage(request.params)

  if (!request.params.names) {
    return invalidParameters(response)
  }

  let names = multiParameter(request.params.names)

  let items = await mongo.collection('items').find({name: {'$in': names}, lang: lang}, ignoredFields).toArray()
  response.send(items)
}

async function bySkin (request, response) {
  let skin_id = parseInt(request.params.skin_id, 10)

  if (!skin_id) {
    return invalidParameters(response)
  }

  let items = await mongo.collection('items').find({skin: skin_id, lang: 'en'}, {_id: 0, id: 1}).toArray()
  response.send(items.map(i => i.id))
}

async function query (request, response) {
  let categories = multiParameter(request.params.categories, false, ';')
  let rarities = multiParameter(request.params.rarities, true, ';')
  let craftable = request.params.craftable
  let excludeName = request.params.exclude_name
  let includeName = request.params.include_name
  let output = request.params.output

  let mongoQuery = {lang: 'en'}

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
  let nameQueries = []

  if (excludeName !== undefined) {
    nameQueries.push({name: {'$regex': '^(?:(?!' + escapeRegex(excludeName) + ').)*$', '$options': 'i'}})
  }

  if (includeName !== undefined) {
    nameQueries.push({name: {'$regex': escapeRegex(includeName), '$options': 'i'}})
  }

  if (nameQueries.length > 0) {
    mongoQuery['$and'] = nameQueries
  }

  // Make sure the prices are set if we output a price breakdown
  if (output === 'prices') {
    mongoQuery['buy.price'] = {$ne: null}
    mongoQuery['sell.price'] = {$ne: null}
  }

  let fields = {_id: 0, id: 1, name: 1, 'buy.price': 1, 'sell.price': 1}
  let items = await mongo.collection('items').find(mongoQuery, fields).toArray()

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

// Generate a mapping from category id => subcategories
let categoryIdMap = {}
Object.values(categoryMap).map(category => {
  categoryIdMap[category[0]] = !category[1] ? false : Object.values(category[1])
})

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

// Get min, avg and max out of a list of values
function valueBreakdown (array) {
  return {
    min: Math.min.apply(null, array),
    avg: Math.round(array.reduce((x, y) => x + y, 0) / array.length),
    max: Math.max.apply(null, array)
  }
}

module.exports = {byId, byIds, all, allPrices, allValues, categories, autocomplete, byName, bySkin, query}
