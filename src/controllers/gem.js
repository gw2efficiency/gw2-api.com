const AbstractController = require('../controller.js')

class GemController extends AbstractController {
  handle (request, response, next) {
    response.send(this.cache.gemPriceHistory)
    next()
  }
}

module.exports = (cache) => new GemController(cache)
