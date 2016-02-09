const AbstractController = require('../controller.js')

class GemController extends AbstractController {
  handle (request, response, next) {
    response.cache('public', {maxAge: 30 * 60})
    response.send(this.cache.gemPriceHistory)
    next()
  }
}

module.exports = (cache) => new GemController(cache)
