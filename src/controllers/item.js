const AbstractController = require('../controller.js')
const categories = require('../static/categories.js')

class ItemController extends AbstractController {
  handle (request, response) {
    let lang = this.requestLanguage(request.params)
    let id = parseInt(request.params.id, 10)

    // Error handling: no parameter set
    if (!id && !request.params.ids) {
      return this.invalidParameters(response)
    }

    // The single id parameter is set, return the single item
    if (id) {
      return response.send(this.byId(id, lang))
    }

    // Handle "ids" parameters based on what endpoint it is
    let ids = request.params.ids
    let content
    switch (ids) {
      case 'all':
        content = this.all(lang)
        break
      case 'all-prices':
        content = this.allPrices(lang)
        break
      case 'categories':
        content = this.categories()
        break
      case 'autocomplete':
        if (!request.params.q) {
          return this.invalidParameters(response)
        }
        content = this.autocomplete(request.params, lang)
        break
      case 'by-name':
        if (!request.params.names) {
          return this.invalidParameters(response)
        }
        let names = this.multiParameter(request.params.names)
        content = this.byName(names, lang)
        break
      case 'by-skin':
        if (!request.params.skin_id) {
          return this.invalidParameters(response)
        }
        content = this.bySkin(parseInt(request.params.skin_id, 10), lang)
        break
      default:
        ids = this.multiParameter(ids, true)
        content = this.byIds(ids, lang)
        break
    }

    response.send(content)
  }

  byId (id, lang) {
    return this.cache.items[lang].find(x => x.id === id)
  }

  byIds (ids, lang) {
    return this.cache.items[lang]
      .filter(x => ids.indexOf(x.id) !== -1)
  }

  all (lang) {
    return this.cache.items[lang].filter(x => x.tradable)
  }

  allPrices (lang) {
    return this.cache.items[lang]
      .filter(x => x.sell && x.buy)
      .map(x => ({
        id: x.id,
        price: Math.max(x.sell.price, x.buy.price)
      }))
  }

  categories () {
    return categories
  }

  autocomplete (params, lang) {
    let query = params.q.toLowerCase()
    let craftable = parseInt(params.craftable, 10) === 1

    if (query.length < 3) {
      return []
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

    return matches.slice(0, 20)
  }

  byName (names, lang) {
    names = names.map(x => x.toLowerCase())
    return this.cache.items[lang]
      .filter(x => names.indexOf(x.name.toLowerCase()) !== -1)
  }

  bySkin (skin, lang) {
    return this.cache.items[lang]
      .filter(x => x.skin)
      .filter(x => skin === x.skin)
      .map(x => x.id)
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
