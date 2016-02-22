const AbstractController = require('../controller.js')
const categories = require('../static/categories.js')

class ItemController extends AbstractController {
  byId (request, response) {
    let lang = this.requestLanguage(request.params)
    let id = parseInt(request.params.id, 10)

    if (!id) {
      return this.invalidParameters(response)
    }

    let content = this.cache.items[lang].find(x => x.id === id)

    response.send(content)
  }

  byIds (request, response) {
    let lang = this.requestLanguage(request.params)
    let ids = this.multiParameter(request.params.ids, true)

    let content = this.cache.items[lang]
      .filter(x => ids.indexOf(x.id) !== -1)

    response.send(content)
  }

  all (request, response) {
    let lang = this.requestLanguage(request.params)
    let content = this.cache.items[lang].filter(x => x.tradable)
    response.send(content)
  }

  allPrices (request, response) {
    let lang = this.requestLanguage(request.params)

    let content = this.cache.items[lang]
      .filter(x => x.sell && x.buy)
      .map(x => ({
        id: x.id,
        price: Math.max(x.sell.price, x.buy.price)
      }))

    response.send(content)
  }

  categories (request, response) {
    response.send(categories)
  }

  autocomplete (request, response) {
    if (!request.params.q) {
      return this.invalidParameters(response)
    }

    let lang = this.requestLanguage(request.params)
    let query = request.params.q.toLowerCase()
    let craftable = parseInt(request.params.craftable, 10) === 1

    if (query.length < 3) {
      return response.send([])
    }

    let matches = this.cache.items[lang]

    if (craftable) {
      matches = matches.filter(x => x.craftable === true)
    }

    matches = matches.filter(x => x.name.toLowerCase().indexOf(query) !== -1)

    matches.sort(function (a, b) {
      a = matchQuality(a.name.toLowerCase(), query)
      b = matchQuality(b.name.toLowerCase(), query)
      return a - b
    })

    matches = matches.slice(0, 20)

    response.send(matches)
  }

  byName (request, response) {
    let lang = this.requestLanguage(request.params)

    if (!request.params.names) {
      return this.invalidParameters(response)
    }

    let names = this.multiParameter(request.params.names)
    names = names.map(x => x.toLowerCase())

    let content = this.cache.items[lang]
      .filter(x => names.indexOf(x.name.toLowerCase()) !== -1)

    response.send(content)
  }

  bySkin (request, response) {
    let skin_id = parseInt(request.params.skin_id, 10)

    if (!skin_id) {
      return this.invalidParameters(response)
    }

    let content = this.cache.items['en']
      .filter(x => x.skin)
      .filter(x => skin_id === x.skin)
      .map(x => x.id)

    response.send(content)
  }

  query (request, response) {
    let categories = this.multiParameter(request.params.categories, false, ';')
    let rarities = this.multiParameter(request.params.rarities, true, ';')
    let craftable = request.params.craftable
    let excludeName = request.params.exclude_name
    let includeName = request.params.include_name
    let output = request.params.output

    let items = this.cache.items['en']

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
}

// Determine the quality of matching a query string in a target string
function matchQuality (target, query) {
  if (target === query) {
    return 0
  }

  let index = target.indexOf(query)
  return 1 + index
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

module.exports = ItemController
