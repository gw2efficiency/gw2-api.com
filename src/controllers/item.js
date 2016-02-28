const storage = require('../helpers/sharedStorage.js')
const {invalidParameters, requestLanguage, multiParameter} = require('../helpers/controllers.js')
const categoryMap = require('../static/categories.js')

function byId (request, response) {
  let lang = requestLanguage(request.params)
  let id = parseInt(request.params.id, 10)

  if (!id) {
    return invalidParameters(response)
  }

  let content = storage.get('items')[lang].find(x => x.id === id)

  response.send(content)
}

function byIds (request, response) {
  let lang = requestLanguage(request.params)
  let ids = multiParameter(request.params.ids, true)

  let content = storage.get('items')[lang]
    .filter(x => ids.indexOf(x.id) !== -1)

  response.send(content)
}

function all (request, response) {
  let lang = requestLanguage(request.params)
  let content = storage.get('items')[lang].filter(x => x.tradable)
  response.send(content)
}

function allPrices (request, response) {
  let lang = requestLanguage(request.params)

  let content = storage.get('items')[lang]
    .filter(x => x.sell && x.buy)
    .map(x => ({
      id: x.id,
      price: Math.max(x.sell.price, x.buy.price)
    }))

  response.send(content)
}

function categories (request, response) {
  response.send(categoryMap)
}

function autocomplete (request, response) {
  if (!request.params.q) {
    return invalidParameters(response)
  }

  let lang = requestLanguage(request.params)
  let query = request.params.q.toLowerCase()
  let craftable = parseInt(request.params.craftable, 10) === 1

  if (query.length < 3) {
    return response.send([])
  }

  let matches = storage.get('items')[lang]

  if (craftable) {
    matches = matches.filter(x => x.craftable === true)
  }

  matches = matches.filter(x => x.name.toLowerCase().indexOf(query) !== -1)

  matches.sort((a, b) => {
    a = matchQuality(a.name.toLowerCase(), query)
    b = matchQuality(b.name.toLowerCase(), query)
    return a - b
  })

  matches = matches.slice(0, 20)

  response.send(matches)
}

// Determine the quality of matching a query string in a target string
function matchQuality (target, query) {
  if (target === query) {
    return 0
  }

  let index = target.indexOf(query)
  return 1 + index
}

function byName (request, response) {
  let lang = requestLanguage(request.params)

  if (!request.params.names) {
    return invalidParameters(response)
  }

  let names = multiParameter(request.params.names)
  names = names.map(x => x.toLowerCase())

  let content = storage.get('items')[lang]
    .filter(x => names.indexOf(x.name.toLowerCase()) !== -1)

  response.send(content)
}

function bySkin (request, response) {
  let skin_id = parseInt(request.params.skin_id, 10)

  if (!skin_id) {
    return invalidParameters(response)
  }

  let content = storage.get('items')['en']
    .filter(x => x.skin)
    .filter(x => skin_id === x.skin)
    .map(x => x.id)

  response.send(content)
}

function query (request, response) {
  let categories = multiParameter(request.params.categories, false, ';')
  let rarities = multiParameter(request.params.rarities, true, ';')
  let craftable = request.params.craftable
  let excludeName = request.params.exclude_name
  let includeName = request.params.include_name
  let output = request.params.output

  let items = storage.get('items')['en']

  if (categories.length > 0) {
    items = filterByCategories(items, categories)
  }

  if (rarities.length > 0) {
    items = items.filter(i => rarities.indexOf(i.rarity) !== -1)
  }

  if (craftable !== undefined) {
    items = items.filter(i => i.craftable)
  }

  if (excludeName !== undefined) {
    excludeName = excludeName.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().indexOf(excludeName) === -1)
  }

  if (includeName !== undefined) {
    includeName = includeName.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().indexOf(includeName) !== -1)
  }

  if (output !== 'prices') {
    return response.send(items.map(i => i.id))
  }

  let buyPrices = items.filter(i => i.buy).map(i => i.buy.price)
  let sellPrices = items.filter(i => i.sell).map(i => i.sell.price)

  items = {
    buy: valueBreakdown(buyPrices),
    sell: valueBreakdown(sellPrices)
  }

  response.send(items)
}

// Filter an array of items by categories
function filterByCategories (items, categories) {
  categories = categories.map(x => x.split(',').map(y => parseInt(y, 10)))
  items = items.filter(i => i.category)

  // Filter categories by the first level
  let firstLevel = categories.map(x => x[0])
  items = items.filter(i => firstLevel.indexOf(i.category[0]) !== -1)

  // IF a second level is defined, generate a map of allowed second levels
  // and see if the items with the first level match the second level
  categories = categories.filter(c => c.length > 1)
  let secondLevel = {}
  categories.map(c => {
    secondLevel[c[0]] = (secondLevel[c[0]] || []).concat([c[1]])
  })

  for (let c in secondLevel) {
    c = parseInt(c, 10)
    items = items.filter(i => c !== i.category[0] || secondLevel[c].indexOf(i.category[1]) !== -1)
  }

  return items
}

// Get min, avg and max out of a list of values
function valueBreakdown (array) {
  return {
    min: Math.min.apply(null, array),
    avg: Math.round(array.reduce((x, y) => x + y, 0) / array.length),
    max: Math.max.apply(null, array)
  }
}

module.exports = {byId, byIds, all, allPrices, categories, autocomplete, byName, bySkin, query}
