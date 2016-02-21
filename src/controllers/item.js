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
    let lang = this.requestLanguage(request.params)
    let skin_id = parseInt(request.params.skin_id, 10)

    if (!skin_id) {
      return this.invalidParameters(response)
    }

    let content = this.cache.items[lang]
      .filter(x => x.skin)
      .filter(x => skin_id === x.skin)
      .map(x => x.id)

    response.send(content)
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

module.exports = ItemController
