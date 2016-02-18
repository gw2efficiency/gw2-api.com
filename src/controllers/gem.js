const AbstractController = require('../controller.js')

class GemController extends AbstractController {
  handle (request, response) {
    response.send(this.cache.gemPriceHistory)
  }
}

module.exports = GemController
