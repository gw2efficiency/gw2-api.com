const AbstractController = require('../controller.js')
const categories = require('../static/categories.js')

class ItemController extends AbstractController {
  handle (request, response, next) {
    let lang = this.requestLanguage(request.params)
    let id = parseInt(request.params.id, 10)

    // Error handling: no parameter set
    if (!id && !request.params.ids) {
      response.status(500)
      response.send({text: 'invalid request parameters'})
      return next()
    }

    // The single id parameter is set, return the single item
    if (id) {
      response.cache('public', {maxAge: 5 * 60})
      response.send(this.byId(id, lang))
      return next()
    }

    // Handle "ids" parameters based on what endpoint it is
    let ids = request.params.ids
    let content
    switch (ids) {
      case 'all':
        content = this.all(lang)
        break
      case 'categories':
        content = this.categories()
        break
      case 'by-name':
        let names = this.multiParameter(request.params.names)
        content = this.byName(names, lang)
        break
      case 'by-skin':
        content = this.bySkin(parseInt(request.params.skin_id, 10), lang)
        break
      default:
        ids = this.multiParameter(ids, true)
        content = this.byIds(ids, lang)
        break
    }

    response.cache('public', {maxAge: 5 * 60})
    response.send(content)
    next()
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

  categories () {
    return categories
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

module.exports = (cache) => new ItemController(cache)
